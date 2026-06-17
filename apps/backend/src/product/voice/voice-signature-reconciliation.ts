import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  UnifiedVoiceSignatureSchema,
  type ArgumentDevelopmentSignature,
  type ReasoningExtractionResult,
  type UnifiedVoiceSignature
} from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { AIPolicyProviderModelAttempt } from "../ai-policy/ai-policy-types.js";
import { filterFormatExpressionsByCoverage, groupExamplesByContentType } from "./reasoning-extraction.js";
import { VoiceSignatureReconciliationError } from "./voice-extraction-errors.js";
import { parseJsonFromLlmResponse } from "./voice-extraction-json.js";

export { VoiceSignatureReconciliationError } from "./voice-extraction-errors.js";

const decodeUnifiedVoiceSignature = Schema.decodeUnknown(UnifiedVoiceSignatureSchema);

export function reconcileVoiceSignatures(args: {
  readonly examples: readonly VoiceExampleRecord[];
  readonly reasoning: ReasoningExtractionResult;
  readonly development: ArgumentDevelopmentSignature;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}): Effect.Effect<UnifiedVoiceSignature, VoiceSignatureReconciliationError> {
  return Effect.gen(function* () {
    const grouped = groupExamplesByContentType(args.examples);
    const systemPrompt = buildReconciliationSystemPrompt();
    const userPrompt = buildReconciliationPrompt(args.reasoning, args.development, grouped, args.examples);

    let lastError: VoiceSignatureReconciliationError | undefined;

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
            temperature: 0,
            metadata: {
              purpose: "voice-signature-reconciliation",
              adapter: attempt.provider,
              model: attempt.model,
              ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
            }
          },
          transport: args.providerTransport.complete
        })
      );

      if (completion._tag === "Left") {
        lastError = new VoiceSignatureReconciliationError({ message: completion.left.message });
        continue;
      }

      const parsed = yield* parseReconciliationResponse(completion.right.response.text).pipe(Effect.either);
      if (parsed._tag === "Left") {
        lastError = parsed.left;
        continue;
      }

      const filtered = filterFormatExpressionsByCoverage(
        {
          core: parsed.right.core,
          formatExpressions: parsed.right.formatExpressions
        },
        grouped
      );

      return {
        core: filtered.core,
        development: parsed.right.development,
        formatExpressions: filtered.formatExpressions
      };
    }

    return yield* Effect.fail(
      lastError ?? new VoiceSignatureReconciliationError({ message: "Voice signature reconciliation failed" })
    );
  });
}

function parseReconciliationResponse(
  content: string
): Effect.Effect<UnifiedVoiceSignature, VoiceSignatureReconciliationError> {
  return Effect.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect.mapError((message) => new VoiceSignatureReconciliationError({ message }))
    );
    const decoded = yield* decodeUnifiedVoiceSignature(parsed).pipe(
      Effect.mapError(
        (error) =>
          new VoiceSignatureReconciliationError({
            message: error instanceof Error ? error.message : "Invalid voice signature reconciliation schema"
          })
      )
    );

    return {
      ...decoded,
      development: {
        ...decoded.development,
        moveLabels: [...new Set(decoded.development.moveLabels.map((item) => item.trim()).filter(Boolean))],
        structuralAntiPatterns: [
          ...new Set(decoded.development.structuralAntiPatterns.map((item) => item.trim()).filter(Boolean))
        ]
      },
      core: {
        ...decoded.core,
        derivedAntiPatterns: [...new Set(decoded.core.derivedAntiPatterns.map((item) => item.trim()).filter(Boolean))]
      }
    };
  });
}

function buildReconciliationPrompt(
  reasoning: ReasoningExtractionResult,
  development: ArgumentDevelopmentSignature,
  grouped: Readonly<Record<string, readonly VoiceExampleRecord[]>>,
  examples: readonly VoiceExampleRecord[]
): string {
  const exampleSections = Object.entries(grouped).map(([contentType, groupedExamples]) => {
    const blocks = groupedExamples
      .map((example, index) => `Example ${index + 1}:\n${example.text.trim()}`)
      .join("\n\n");
    return `## ${contentType}\n${blocks}`;
  });

  return [
    "Voice examples are ground truth. Harmonize the draft Core Reasoning Signature and Argument Development Signature into one coherent author profile.",
    "Keep Core focused on cognitive traits; keep Development focused on how texts unfold.",
    "Resolve contradictions without collapsing the two layers into duplicate prose.",
    "",
    "Draft Core:",
    JSON.stringify(reasoning.core, null, 2),
    "",
    "Draft Development:",
    JSON.stringify(development, null, 2),
    "",
    "Draft Format Expressions:",
    JSON.stringify(reasoning.formatExpressions, null, 2),
    "",
    "Examples:",
    ...exampleSections,
    "",
    `Total active examples: ${examples.filter((example) => example.state === "active").length}`
  ].join("\n");
}

function buildReconciliationSystemPrompt(): string {
  return [
    "You reconcile author voice signature drafts into one coherent profile.",
    "Respond with JSON only.",
    "Schema:",
    "{",
    '  "core": { narrativeProse, certaintyLevel, judgmentFrequency, conclusionPace, readerRelationship, authoritySource, derivedAntiPatterns },',
    '  "development": { developmentProse, moveLabels, transitionTendencies, epistemicPosture, structuralAntiPatterns },',
    '  "formatExpressions": { "<contentType>": { contentType, narrativeProse, register, openingStyle, technicalDensity } }',
    "}"
  ].join("\n");
}
