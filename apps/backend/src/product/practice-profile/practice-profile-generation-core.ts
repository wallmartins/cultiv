import { Effect } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type {
  AIPolicyProviderModelAttempt,
  ResolvedAIPolicyVersion
} from "../ai-policy/ai-policy-types.js";
import { parseJsonFromLlmResponse } from "../voice/voice-extraction-json.js";
import { PracticeProfileGenerationError } from "./practice-profile-errors.js";
import { GENERATOR_CLICHE_RETRY_SUFFIX, detectClicheLeak } from "./practice-profile-anti-patterns.js";

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

    for (const attempt of deps.attempts) {
      for (let retry = 0; retry < 2; retry += 1) {
        const userPrompt = config.buildUser(retry === 0 ? "" : GENERATOR_CLICHE_RETRY_SUFFIX);
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

        if (retry === 0 && detectClicheLeak(config.selectClicheProbe(parsed.right))) {
          continue;
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
