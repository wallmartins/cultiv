import { Effect } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type {
  AIPolicyProviderModelAttempt,
  ResolvedAIPolicyVersion
} from "../ai-policy/ai-policy-types.js";
import { parseJsonFromLlmResponse } from "../voice/voice-extraction-json.js";
import { PracticeProfileGenerationError } from "./practice-profile-errors.js";
import {
  GENERATOR_ANTI_PATTERN_RULES,
  assessClicheLeak,
  buildClicheRetrySuffix
} from "./practice-profile-anti-patterns.js";

// F2-2: the Gemini→Groq chain lives in catalog.json under this routing profile (config, not infra).
export const PRACTICE_PROFILE_ROUTING_PROFILE_ID = "practice-profile-llm";

// The provider chain both the onboarding seam (G1/G3) and the rebuild enrichment (G2) resolve the same
// way — preferred then fallback attempts of the practice-profile routing profile (empty if unconfigured,
// which the generation core surfaces as "no provider attempts configured").
export function resolvePracticeProfileAttempts(
  policy: ResolvedAIPolicyVersion
): readonly AIPolicyProviderModelAttempt[] {
  const routingProfile = policy.routingProfiles[PRACTICE_PROFILE_ROUTING_PROFILE_ID];
  return routingProfile
    ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts]
    : [];
}

export type PracticeProfileLocale = "pt-BR" | "en-US";

export function resolvePracticeProfileLocale(language: string | undefined): PracticeProfileLocale {
  return language?.toLowerCase().startsWith("en") ? "en-US" : "pt-BR";
}

export function localeLabel(locale: PracticeProfileLocale): string {
  return locale === "en-US" ? "English (en-US)" : "Brazilian Portuguese (pt-BR)";
}

export interface DeclaredPracticeAxes {
  readonly subject: string;
  readonly vantagePoint: string;
  readonly audiences: readonly string[];
}

export function formatDeclaredAxes(axes: DeclaredPracticeAxes): string {
  return [
    "== DECLARED PRACTICE (author-sovereign — echo verbatim, never rewrite) ==",
    `Subject: ${axes.subject}`,
    `Vantage point: ${axes.vantagePoint}`,
    `Audiences: ${axes.audiences.join("; ")}`
  ].join("\n");
}

// C-1 idempotency rule: identical declared axes ⇒ same practice lifecycle (reuse the stored profile,
// never regress enriched→seed); changed axes ⇒ legitimate re-seed (ADR 0010 §4). Case and audience
// order are cosmetic, not a new lifecycle.
export function sameDeclaredAxes(a: DeclaredPracticeAxes, b: DeclaredPracticeAxes): boolean {
  const fold = (value: string) => value.trim().toLowerCase();
  const audiencesA = a.audiences.map(fold).sort();
  const audiencesB = b.audiences.map(fold).sort();
  return (
    fold(a.subject) === fold(b.subject) &&
    fold(a.vantagePoint) === fold(b.vantagePoint) &&
    audiencesA.length === audiencesB.length &&
    audiencesA.every((audience, index) => audience === audiencesB[index])
  );
}

// C-10: the system-prompt scaffold shared by every generative surface (G1/G2, G3, G4) — only the
// role line and an optional output-language note vary per surface.
export function buildSystemPromptScaffold(args: {
  readonly role: string;
  readonly locale: PracticeProfileLocale;
  readonly languageNote?: string;
}): string {
  return [
    args.role,
    "Respond with JSON only — no markdown fences or commentary.",
    `OUTPUT LANGUAGE: write every value in ${localeLabel(args.locale)}.${args.languageNote ? ` ${args.languageNote}` : ""}`,
    "The average of a field IS that field's cliché. Anchor everything you write in named specifics and steer away from the average.",
    GENERATOR_ANTI_PATTERN_RULES
  ].join("\n");
}

// The seven Practice Dimensions (norte backbone-curado.md). The curated structure the LLM fills — it
// never decides which dimensions exist, only what each holds for THIS field, anchored in specifics.
export const PRACTICE_DIMENSIONS_GUIDE = [
  "== THE 7 PRACTICE DIMENSIONS (fill each with field-specific, NAMED content) ==",
  "1. point — what counts as 'having something to say' here: a thesis, an offer/desired action, a finding, or a provocation. NOT always a thesis.",
  "2. evidence — what anchors a claim in THIS field: a production incident, a small-sample client number, a before/after, a concrete scene. NOT always personal experience.",
  "3. readerAssumption — the shared baseline the reader already knows (never re-explained) AND the bridge that is still missing.",
  "4. resistance — the honest other side, in this field's shape: an intellectual counterpoint, a purchase blocker, an internal-sell objection, or a cliché to avoid on purpose.",
  "5. stake — why the READER decides now (never the author's stake): a one-way-door decision, an environmental change, act-now-vs-later. Folds in the cost of being wrong.",
  "6. fieldCliche — the field's generic average, to avoid on purpose. Name a REAL, specific cliché of this field ('rewrite it in Rust', 'engagement and authenticity'), never a generic one.",
  "7. lexicon — the real insider vocabulary of the field (positive, not a blocklist). A list of terms a practitioner actually uses."
].join("\n");

interface PracticeProfileGenerationConfig<T> {
  readonly purpose: string;
  readonly system: string;
  // Rebuilt per attempt so the cliché-retry suffix can be appended without mutating the base prompt.
  readonly buildUser: (retrySuffix: string) => string;
  readonly decode: (input: unknown) => Effect.Effect<T, unknown>;
  // Only specificity-bearing fields — never fieldCliche/lexicon, where naming a cliché is correct.
  readonly selectClicheProbe: (result: T) => readonly string[];
  // Surface-specific honest escape appended to the cliché-retry suffix (C-10) — only G2 may promise
  // the G5 niche-ask signal.
  readonly retryEscape: string;
  // G2 only: a merely-thin retry output is accepted (honest degrade — thin dimensions become the G5
  // niche-ask downstream). A filler-phrase hit still fails the attempt on every surface.
  readonly acceptThinAfterRetry?: boolean;
  readonly temperature?: number;
}

export interface PracticeProfileGenerationDeps {
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}

// Mirrors runSignatureExtraction (product/voice): iterate the provider chain, parse JSON, decode,
// and retry once against the cliché suffix when a specificity-bearing field reads as generic.
export function runPracticeProfileGeneration<T>(
  config: PracticeProfileGenerationConfig<T>,
  deps: PracticeProfileGenerationDeps
): Effect.Effect<T, PracticeProfileGenerationError> {
  return Effect.gen(function* () {
    if (deps.attempts.length === 0) {
      return yield* Effect.fail(
        new PracticeProfileGenerationError({ message: "no provider attempts configured" })
      );
    }

    let lastError: PracticeProfileGenerationError | undefined;
    const retrySuffix = buildClicheRetrySuffix(config.retryEscape);

    for (const attempt of deps.attempts) {
      for (let retry = 0; retry < 2; retry += 1) {
        const userPrompt = config.buildUser(retry === 0 ? "" : retrySuffix);
        const completion = yield* Effect.either(
          deps.aiAdapters.complete({
            request: {
              provider: attempt.provider,
              model: attempt.model,
              messages: [
                { role: "system", content: config.system },
                { role: "user", content: userPrompt }
              ],
              temperature: config.temperature ?? 0.3,
              metadata: {
                purpose: config.purpose,
                adapter: attempt.provider,
                model: attempt.model,
                ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
              }
            },
            transport: deps.providerTransport.complete
          })
        );

        if (completion._tag === "Left") {
          lastError = new PracticeProfileGenerationError({ message: completion.left.message });
          break;
        }

        const parsed = yield* parseResponse(config, completion.right.response.text).pipe(Effect.either);
        if (parsed._tag === "Left") {
          lastError = parsed.left;
          break;
        }

        // C-2: the leak check also runs on the retry output — a still-generic second pass counts as
        // a failed attempt and moves to the next provider instead of shipping a generic result.
        const leak = assessClicheLeak(config.selectClicheProbe(parsed.right));
        if (leak.fillerHit || leak.thin) {
          if (retry === 0) {
            continue;
          }
          if (config.acceptThinAfterRetry && !leak.fillerHit) {
            return parsed.right;
          }
          lastError = new PracticeProfileGenerationError({
            message: `${config.purpose}: output stayed generic after the cliché retry`
          });
          break;
        }

        return parsed.right;
      }
    }

    return yield* Effect.fail(
      lastError ?? new PracticeProfileGenerationError({ message: "practice profile generation failed" })
    );
  });
}

function parseResponse<T>(
  config: PracticeProfileGenerationConfig<T>,
  content: string
): Effect.Effect<T, PracticeProfileGenerationError> {
  return Effect.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect.mapError((message) => new PracticeProfileGenerationError({ message }))
    );

    return yield* config.decode(parsed).pipe(
      Effect.mapError(
        (error) =>
          new PracticeProfileGenerationError({
            message: error instanceof Error ? error.message : "invalid practice profile schema"
          })
      )
    );
  });
}
