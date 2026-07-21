import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import {
  GenerationIntentSchema,
  GenerationLengthTierSchema,
  PHASE1_DEFAULT_LENGTH_BY_INTENT,
  type GenerationIntent,
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
import { INTENT_CATALOG_COPY, resolveLocaleCopy } from "../catalog/generation-intent-catalog.js";
import { detectPlatformInTheme } from "./generation-prefill-platform.js";
import type {
  BackendGenerationPrefillRequest,
  BackendGenerationPrefillService
} from "./generation-prefill-types.js";

// ponytail: reuses default-llm (12s timeout, gemini-3.1-flash-lite -> 2.5-flash -> 1.5-pro) for the
// MVP instead of a dedicated "prefill-inference-llm" profile — contract-07 explicitly sanctions this;
// split it out once eval shows the shared profile's latency/cost doesn't fit prefill.
const ROUTING_PROFILE_ID = "default-llm";

const LlmPrefillResultSchema = Schema.Struct({
  intent: GenerationIntentSchema,
  ambiguous: Schema.Boolean,
  alternativeIntent: Schema.optional(GenerationIntentSchema),
  lengthTier: GenerationLengthTierSchema,
  briefingSeed: Schema.optional(Schema.String),
  extraQuestions: Schema.optional(Schema.Array(Schema.Struct({ prompt: Schema.String })))
});
type LlmPrefillResult = typeof LlmPrefillResultSchema.Type;
const decodeLlmPrefillResult = Schema.decodeUnknown(LlmPrefillResultSchema);

type Locale = "pt-BR" | "en-US";

const BACKBONE_QUESTION_COPY: Readonly<
  Record<Locale, ReadonlyArray<{ readonly angle: "thesis" | "experience" | "tension" | "motivation"; readonly prompt: (theme: string) => string }>>
> = {
  "pt-BR": [
    { angle: "thesis", prompt: (theme) => `Qual é a tese ou hipótese central que você quer defender sobre "${theme}"?` },
    { angle: "experience", prompt: () => "Que experiência concreta sua seria o melhor exemplo aqui?" },
    { angle: "tension", prompt: () => "Existe um contraponto, uma tensão ou uma objeção que vale a pena nomear?" },
    { angle: "motivation", prompt: () => "Por que esse tema importa pra você agora?" }
  ],
  "en-US": [
    { angle: "thesis", prompt: (theme) => `What's the core thesis or hypothesis you want to make about "${theme}"?` },
    { angle: "experience", prompt: () => "What concrete experience of yours would be the strongest example here?" },
    { angle: "tension", prompt: () => "Is there a counterpoint, tension, or objection worth naming?" },
    { angle: "motivation", prompt: () => "Why does this matter to you right now?" }
  ]
};

export function createBackendGenerationPrefillService(options: {
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly aiPolicy: BackendAIPolicyServiceContract;
}): BackendGenerationPrefillService {
  return {
    infer(args: BackendGenerationPrefillRequest) {
      return Effect.gen(function* () {
        const locale = resolveLocaleCopy(args.language ?? "pt-BR");
        const detectedPlatform = detectPlatformInTheme(args.theme);

        const policy = yield* options.aiPolicy.getActivePolicy().pipe(
          Effect.mapError((error) => new PrefillInferenceInfraError({ message: error.message }))
        );
        const routingProfile = policy.routingProfiles[ROUTING_PROFILE_ID];
        const attempts = routingProfile
          ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts]
          : [];

        // Graceful fallback (ADR 0004 §3/§5): inference failure never blocks the flow — it degrades
        // to the default response below. Only the getActivePolicy() failure above is a genuine infra error.
        let inference: LlmPrefillResult | undefined;
        if (attempts.length > 0) {
          inference = yield* runLlmInference({
            theme: args.theme,
            language: args.language,
            attempts,
            aiAdapters: options.aiAdapters,
            providerTransport: options.providerTransport
          }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
        }

        // F4-3: args.audience (narrowed public) will drive audience-aware slot instantiation here,
        // replacing the up-front intent classification below. Groundwork socket only — not consumed yet.
        return buildResponse({
          theme: args.theme,
          language: args.language,
          locale,
          detectedPlatform,
          inference
        });
      });
    }
  };
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
  const intentLines = (Object.keys(INTENT_CATALOG_COPY) as GenerationIntent[]).map(
    (intent) => `- ${intent}: ${INTENT_CATALOG_COPY[intent]["en-US"].description}`
  );

  return [
    "You infer a lightweight generation setup from a short free-text theme for Cultiv, a writing tool.",
    "Respond with JSON only — no markdown fences or commentary.",
    "Classify the theme into exactly one intent (the rhetorical angle the author most likely wants):",
    ...intentLines,
    "Only set \"ambiguous\": true when two intents are similarly likely; when true, set \"alternativeIntent\" to the second-best intent.",
    "\"lengthTier\" is short|medium|long — infer from explicit cues (e.g. \"quick post\" -> short, \"deep dive\" -> long); default to the intent's typical length when unclear.",
    "\"briefingSeed\" is an optional one-sentence amplification of the theme in the author's own words — never invent facts, experiences, or opinions the theme doesn't state.",
    "\"extraQuestions\" holds 0 to 2 follow-up questions ONLY when the theme suggests a genuinely useful angle beyond thesis, personal experience, counter-tension, and motivation — otherwise return an empty array.",
    "Write briefingSeed and extraQuestions prompts in the same language as the theme.",
    "Schema:",
    "{",
    '  "intent": "share-idea|explain-deeply|engage-audience|tell-story|update-subscribers|document-decision",',
    '  "ambiguous": boolean,',
    '  "alternativeIntent": "<same literals, only when ambiguous>",',
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
  readonly locale: Locale;
  readonly detectedPlatform: string | undefined;
  readonly inference: LlmPrefillResult | undefined;
}): GenerationPrefillResponse {
  const intent: GenerationIntent = args.inference?.intent ?? "share-idea";
  const lengthTier = args.inference?.lengthTier ?? PHASE1_DEFAULT_LENGTH_BY_INTENT[intent];
  const ambiguous = args.inference?.ambiguous ?? false;
  const briefingSeed = args.inference?.briefingSeed;

  return {
    prefill: {
      intent,
      scope: { lengthTier },
      ...(briefingSeed ? { briefing: { topic: briefingSeed } } : {}),
      ...(args.language ? { language: args.language } : {})
    },
    intentAmbiguity: ambiguous
      ? {
          ambiguous: true,
          ...(args.inference?.alternativeIntent ? { alternative: args.inference.alternativeIntent } : {})
        }
      : null,
    ...(args.detectedPlatform ? { detectedPlatform: args.detectedPlatform } : {}),
    questionPlan: buildQuestionPlan(args.locale, args.theme, args.inference?.extraQuestions ?? [])
  };
}

function buildQuestionPlan(
  locale: Locale,
  theme: string,
  extraQuestions: readonly { readonly prompt: string }[]
): GenerationPrefillQuestion[] {
  const backbone = BACKBONE_QUESTION_COPY[locale].map((entry) => ({
    id: entry.angle,
    angle: entry.angle,
    prompt: entry.prompt(theme)
  }));
  const extras = extraQuestions.slice(0, 2).map((question, index) => ({
    id: `extra-${index + 1}`,
    angle: "extra" as const,
    prompt: question.prompt
  }));

  return [...backbone, ...extras];
}
