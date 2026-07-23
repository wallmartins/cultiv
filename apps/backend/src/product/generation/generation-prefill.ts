import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { toPracticeProfileDomain } from "@my-ai-orchestrator/database";
import {
  GenerationLengthTierSchema,
  type GenerationPrefillQuestion,
  type GenerationPrefillResponse
} from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type {
  AIPolicyProviderModelAttempt,
  BackendAIPolicyServiceContract
} from "../ai-policy/ai-policy-types.js";
import { PrefillInferenceInfraError } from "../../http/errors.js";
import { parseJsonFromLlmResponse } from "../voice/voice-extraction-json.js";
import { detectPlatformInTheme } from "./generation-prefill-platform.js";
import { domainProfileToContracts } from "../practice-profile/practice-profile-domain-bridge.js";
import {
  resolvePracticeProfileAttempts,
  resolvePracticeProfileLocale,
  type PracticeProfileLocale
} from "../practice-profile/practice-profile-generation-core.js";
import {
  backboneGenerationSlots,
  generateGenerationSlots,
  type GenerationSlotKey,
  type GenerationSlotSet
} from "../practice-profile/practice-profile-generation-slots.js";
import type {
  BackendGenerationPrefillRequest,
  BackendGenerationPrefillService
} from "./generation-prefill-types.js";

// ponytail: reuses default-llm (12s timeout, gemini-3.1-flash-lite -> 2.5-flash -> 1.5-pro) for the
// MVP instead of a dedicated "prefill-inference-llm" profile — contract-07 explicitly sanctions this;
// split it out once eval shows the shared profile's latency/cost doesn't fit prefill.
const ROUTING_PROFILE_ID = "default-llm";

// F1-2: the prefill no longer classifies a rhetorical genre — genre is inferred at the end of the
// generation questions (Phase 4 producer). It only seeds size, a briefing amplification, and extras.
const LlmPrefillResultSchema = Schema.Struct({
  lengthTier: GenerationLengthTierSchema,
  briefingSeed: Schema.optional(Schema.String),
  extraQuestions: Schema.optional(Schema.Array(Schema.Struct({ prompt: Schema.String })))
});
type LlmPrefillResult = typeof LlmPrefillResultSchema.Type;
const decodeLlmPrefillResult = Schema.decodeUnknown(LlmPrefillResultSchema);

// The prefill's four backbone angles map 1:1 onto the G4 curated slots (backbone-curado.md): the slot
// generator writes each question, and this mapping keeps the wire vocabulary (thesis/experience/
// tension/motivation) that the web's buildBriefing already folds back into payload/anchor/resistance/
// stake. The generic degrade copy lives once, in the slots module (backboneGenerationSlots).
const SLOT_TO_ANGLE: Record<GenerationSlotKey, "thesis" | "experience" | "tension" | "motivation"> = {
  payload: "thesis",
  anchor: "experience",
  resistance: "tension",
  stake: "motivation"
};

export function createBackendGenerationPrefillService(options: {
  readonly database: DatabaseClient;
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly aiPolicy: BackendAIPolicyServiceContract;
}): BackendGenerationPrefillService {
  return {
    infer(args: BackendGenerationPrefillRequest) {
      return Effect.gen(function* () {
        const locale = resolvePracticeProfileLocale(args.language);
        const detectedPlatform = detectPlatformInTheme(args.theme);

        const policy = yield* options.aiPolicy.getActivePolicy().pipe(
          Effect.mapError((error) => new PrefillInferenceInfraError({ message: error.message }))
        );
        const routingProfile = policy.routingProfiles[ROUTING_PROFILE_ID];
        const attempts = routingProfile
          ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts]
          : [];

        // The size/extras inference and the G4 slot generation are independent LLM calls on the same
        // user-facing "analyzing" step, so they run concurrently. Both degrade internally and never
        // fail: inference failure → default response (ADR 0004 §3/§5); G4 failure → generic backbone.
        // Only the getActivePolicy() failure above is a genuine infra error.
        const [inference, slots] = yield* Effect.all(
          [
            attempts.length > 0
              ? runLlmInference({
                  theme: args.theme,
                  language: args.language,
                  attempts,
                  aiAdapters: options.aiAdapters,
                  providerTransport: options.providerTransport
                }).pipe(Effect.catchAll(() => Effect.succeed(undefined)))
              : Effect.succeed<LlmPrefillResult | undefined>(undefined),
            // F4-3 · G4 slots (norte gerador-spec §G4): written from the author's Practice Profile ×
            // theme × narrowed audience; degrades to the generic backbone when there is no profile yet,
            // no practice-profile attempts, no declared audience, or generation fails.
            resolveSlotQuestions({
              database: options.database,
              aiAdapters: options.aiAdapters,
              providerTransport: options.providerTransport,
              attempts: resolvePracticeProfileAttempts(policy),
              userId: args.userId,
              theme: args.theme,
              audience: args.audience,
              locale
            })
          ],
          { concurrency: "unbounded" }
        );

        return buildResponse({
          theme: args.theme,
          language: args.language,
          detectedPlatform,
          inference,
          slots
        });
      });
    }
  };
}

// Aggregate ceiling on the G4 generation so this user-facing "analyzing" step degrades to the backbone
// instead of dragging through the full practice-profile provider chain (3 attempts × up to 2 tries).
// Same defect class as C-7 (onboarding setContext), same remedy: bound it, then degrade. Roughly two
// attempts of the practice-profile-llm chain before falling back.
const G4_SLOT_BUDGET = "45 seconds" as const;

// Loads the author's Practice Profile and writes the four G4 slot questions from it (× theme ×
// narrowed audience); any missing piece — no profile, no attempts, no declared audience, a generation
// failure, or exceeding G4_SLOT_BUDGET — degrades to the generic field-agnostic backbone. Fully
// graceful: the audience narrowing (args.audience) is the F4-2 socket; absent, it falls back to the
// profile's own audiences.
function resolveSlotQuestions(args: {
  readonly database: DatabaseClient;
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly userId: string;
  readonly theme: string;
  readonly audience: string | undefined;
  readonly locale: PracticeProfileLocale;
}): Effect.Effect<GenerationSlotSet> {
  return Effect.gen(function* () {
    const record = yield* args.database.practiceProfiles.getByUser(args.userId);
    if (!record) {
      return yield* Effect.fail(undefined);
    }

    const profile = domainProfileToContracts(toPracticeProfileDomain(record));
    const narrowedAudience = args.audience?.trim() || profile.audiences.join("; ");
    if (narrowedAudience.length === 0 || args.attempts.length === 0) {
      return yield* Effect.fail(undefined);
    }

    return yield* generateGenerationSlots({
      profile,
      theme: args.theme,
      narrowedAudience,
      locale: args.locale,
      deps: {
        attempts: args.attempts,
        aiAdapters: args.aiAdapters,
        providerTransport: args.providerTransport
      }
    });
  }).pipe(
    Effect.timeoutFail({ onTimeout: () => undefined, duration: G4_SLOT_BUDGET }),
    Effect.orElseSucceed(() => backboneGenerationSlots({ theme: args.theme, locale: args.locale }))
  );
}

function runLlmInference(args: {
  readonly theme: string;
  readonly language: string | undefined;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}): Effect.Effect<LlmPrefillResult, string> {
  return Effect.gen(function* () {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(args.theme, args.language);

    for (const attempt of args.attempts) {
      const completion = yield* Effect.either(
        args.aiAdapters.complete({
          request: {
            provider: attempt.provider,
            model: attempt.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.15,
            metadata: {
              purpose: "generation-prefill-inference",
              adapter: attempt.provider,
              model: attempt.model,
              ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
            }
          },
          transport: args.providerTransport.complete
        })
      );

      if (completion._tag === "Left") {
        continue;
      }

      const parsed = yield* parseJsonFromLlmResponse(completion.right.response.text).pipe(Effect.either);
      if (parsed._tag === "Left") {
        continue;
      }

      const decoded = yield* decodeLlmPrefillResult(parsed.right).pipe(Effect.either);
      if (decoded._tag === "Left") {
        continue;
      }

      return decoded.right;
    }

    return yield* Effect.fail("generation prefill inference exhausted all attempts");
  });
}

function buildSystemPrompt(): string {
  return [
    "You infer a lightweight generation setup from a short free-text theme for Cultiv, a writing tool.",
    "Respond with JSON only — no markdown fences or commentary.",
    "\"lengthTier\" is short|medium|long — infer from explicit cues (e.g. \"quick post\" -> short, \"deep dive\" -> long); default to short when unclear.",
    "\"briefingSeed\" is an optional one-sentence amplification of the theme in the author's own words — never invent facts, experiences, or opinions the theme doesn't state.",
    "\"extraQuestions\" holds 0 to 2 follow-up questions ONLY when the theme suggests a genuinely useful angle beyond thesis, personal experience, counter-tension, and motivation — otherwise return an empty array.",
    "Write briefingSeed and extraQuestions prompts in the same language as the theme.",
    "Schema:",
    "{",
    '  "lengthTier": "short|medium|long",',
    '  "briefingSeed": "string (optional)",',
    '  "extraQuestions": [{ "prompt": "string" }]',
    "}"
  ].join("\n");
}

function buildUserPrompt(theme: string, language: string | undefined): string {
  return [`Theme: ${theme.trim()}`, language ? `Language hint: ${language}` : ""]
    .filter((line) => line.length > 0)
    .join("\n");
}

function buildResponse(args: {
  readonly theme: string;
  readonly language: string | undefined;
  readonly detectedPlatform: string | undefined;
  readonly inference: LlmPrefillResult | undefined;
  readonly slots: GenerationSlotSet;
}): GenerationPrefillResponse {
  // rhetoricalMode is deliberately left unset — genre is inferred at the END of the questions from the
  // author's answers (the /me/genre-inference producer, F4-7), never from the theme at prefill time.
  const lengthTier = args.inference?.lengthTier ?? "short";
  const briefingSeed = args.inference?.briefingSeed;

  return {
    prefill: {
      scope: { lengthTier },
      ...(briefingSeed ? { briefing: { topic: briefingSeed } } : {}),
      ...(args.language ? { language: args.language } : {})
    },
    ...(args.detectedPlatform ? { detectedPlatform: args.detectedPlatform } : {}),
    questionPlan: buildQuestionPlan(args.slots, args.inference?.extraQuestions ?? [])
  };
}

function buildQuestionPlan(
  slots: GenerationSlotSet,
  extraQuestions: readonly { readonly prompt: string }[]
): GenerationPrefillQuestion[] {
  const backbone = slots.map((slot) => {
    const angle = SLOT_TO_ANGLE[slot.slot];
    return { id: angle, angle, prompt: slot.question };
  });
  const extras = extraQuestions.slice(0, 2).map((question, index) => ({
    id: `extra-${index + 1}`,
    angle: "extra" as const,
    prompt: question.prompt
  }));

  return [...backbone, ...extras];
}
