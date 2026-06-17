import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  ArgumentDevelopmentExtractionResultSchema,
  type ArgumentDevelopmentExtractionResult,
  type DevelopmentTraits,
  type TraitEvidenceDraft
} from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { AIPolicyProviderModelAttempt } from "../ai-policy/ai-policy-types.js";
import {
  isLikelyPortugueseText,
  resolveReasoningOutputLanguage,
  type ReasoningOutputLanguage
} from "./reasoning-extraction.js";
import { ArgumentDevelopmentExtractionError } from "./voice-extraction-errors.js";
import { parseJsonFromLlmResponse } from "./voice-extraction-json.js";

export { ArgumentDevelopmentExtractionError } from "./voice-extraction-errors.js";

const decodeDevelopmentExtraction = Schema.decodeUnknown(ArgumentDevelopmentExtractionResultSchema);

const LANGUAGE_RETRY_SUFFIX =
  "\n\nRETRY: Your previous JSON used the wrong language. Rewrite developmentProse in Brazilian Portuguese. Do not use English in developmentProse.";

export function extractArgumentDevelopmentSignature(args: {
  readonly examples: readonly VoiceExampleRecord[];
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}): Effect.Effect<ArgumentDevelopmentExtractionResult, ArgumentDevelopmentExtractionError> {
  return Effect.gen(function* () {
    const activeExamples = args.examples.filter((example) => example.state === "active");
    if (activeExamples.length < 2) {
      return yield* Effect.fail(
        new ArgumentDevelopmentExtractionError({
          message: "At least two active examples are required for development extraction"
        })
      );
    }

    const outputLanguage = resolveReasoningOutputLanguage(activeExamples);
    const systemPrompt = buildDevelopmentExtractionSystemPrompt(outputLanguage);
    let userPrompt = buildDevelopmentExtractionPrompt(activeExamples, outputLanguage);

    let lastError: ArgumentDevelopmentExtractionError | undefined;

    for (const attempt of args.attempts) {
      for (let languageRetry = 0; languageRetry < 2; languageRetry += 1) {
        const completion = yield* Effect.either(
          args.aiAdapters.complete({
            request: {
              provider: attempt.provider,
              model: attempt.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.2,
              metadata: {
                purpose: "argument-development-extraction",
                adapter: attempt.provider,
                model: attempt.model,
                ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
              }
            },
            transport: args.providerTransport.complete
          })
        );

        if (completion._tag === "Left") {
          lastError = new ArgumentDevelopmentExtractionError({ message: completion.left.message });
          break;
        }

        const parsed = yield* parseDevelopmentExtractionResponse(completion.right.response.text).pipe(Effect.either);
        if (parsed._tag === "Left") {
          lastError = parsed.left;
          break;
        }

        if (
          outputLanguage.primary === "pt"
          && languageRetry === 0
          && !isLikelyPortugueseText(parsed.right.development.developmentProse)
        ) {
          userPrompt = `${buildDevelopmentExtractionPrompt(activeExamples, outputLanguage)}${LANGUAGE_RETRY_SUFFIX}`;
          continue;
        }

        return normalizeDevelopmentExtractionResult(parsed.right);
      }
    }

    return yield* Effect.fail(
      lastError ?? new ArgumentDevelopmentExtractionError({ message: "Argument development extraction failed" })
    );
  });
}

export function buildDevelopmentExtractionMessages(
  examples: readonly VoiceExampleRecord[]
): { readonly system: string; readonly user: string } {
  const activeExamples = examples.filter((example) => example.state === "active");
  const outputLanguage = resolveReasoningOutputLanguage(activeExamples);

  return {
    system: buildDevelopmentExtractionSystemPrompt(outputLanguage),
    user: buildDevelopmentExtractionPrompt(activeExamples, outputLanguage)
  };
}

function parseDevelopmentExtractionResponse(
  content: string
): Effect.Effect<ArgumentDevelopmentExtractionResult, ArgumentDevelopmentExtractionError> {
  return Effect.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect.mapError((message) => new ArgumentDevelopmentExtractionError({ message }))
    );
    const decoded = yield* decodeDevelopmentExtraction(parsed).pipe(
      Effect.mapError(
        (error) =>
          new ArgumentDevelopmentExtractionError({
            message: error instanceof Error ? error.message : "Invalid argument development extraction schema"
          })
      )
    );

    return normalizeDevelopmentExtractionResult(decoded);
  });
}

function normalizeDevelopmentExtractionResult(
  result: ArgumentDevelopmentExtractionResult
): ArgumentDevelopmentExtractionResult {
  const { traitProfile: _ignored, ...developmentCore } = result.development;

  return {
    ...(result.traits ? { traits: result.traits } : {}),
    ...(result.traitEvidence ? { traitEvidence: result.traitEvidence } : {}),
    development: {
      ...developmentCore,
      moveLabels: [...new Set(developmentCore.moveLabels.map((item) => item.trim()).filter(Boolean))],
      structuralAntiPatterns: [
        ...new Set(developmentCore.structuralAntiPatterns.map((item) => item.trim()).filter(Boolean))
      ],
      transitionTendencies: developmentCore.transitionTendencies.filter(
        (tendency) => tendency.from.trim().length > 0 && tendency.to.trim().length > 0
      )
    }
  };
}

function buildDevelopmentExtractionPrompt(
  examples: readonly VoiceExampleRecord[],
  outputLanguage: ReasoningOutputLanguage
): string {
  const exampleBlocks = examples
    .map((example, index) => `Example ${index + 1} (language: ${example.language}):\n${example.text.trim()}`)
    .join("\n\n");

  return [
    `Dominant example language: ${outputLanguage.bcp47} (${outputLanguage.label}).`,
    `Write developmentProse in ${outputLanguage.label}.`,
    "Analyze how the author develops texts — argumentative moves, transitions, epistemic posture while writing, and structural habits.",
    "Do NOT infer cognitive traits (certainty, judgment) — focus on how the text unfolds.",
    "Do NOT impose a fixed phase template; infer moves from examples only.",
    "Return JSON only matching the agreed schema.",
    resolveDevelopmentLanguageInstruction(outputLanguage),
    "",
    exampleBlocks
  ].join("\n");
}

function resolveDevelopmentLanguageInstruction(outputLanguage: ReasoningOutputLanguage): string {
  if (outputLanguage.primary === "pt") {
    return "CRITICAL: developmentProse MUST be written in Brazilian Portuguese (pt-BR).";
  }

  if (outputLanguage.primary === "en") {
    return "CRITICAL: developmentProse MUST be written in English.";
  }

  return "CRITICAL: developmentProse MUST match the majority example language.";
}

function buildDevelopmentExtractionSystemPrompt(outputLanguage: ReasoningOutputLanguage): string {
  return [
    "You extract how an author develops texts from writing examples.",
    "Respond with JSON only — no markdown fences or commentary.",
    `OUTPUT LANGUAGE: ${outputLanguage.label} (${outputLanguage.bcp47}).`,
    `developmentProse MUST be written in ${outputLanguage.label}.`,
    "Enum fields remain schema literals in English.",
    "Schema:",
    "{",
    '  "development": {',
    '    "developmentProse": "string",',
    '    "moveLabels": ["author-specific move label"],',
    '    "transitionTendencies": [{ "from": "move", "to": "move", "frequency": "rare|occasional|common|dominant" }],',
    '    "epistemicPosture": "exploratory|investigative|advocacy_mixed",',
    '    "structuralAntiPatterns": ["wrong arc label"]',
    "  },",
    '  "traits": {',
    '    "openingMode": "observation|thesis|mixed",',
    '    "perspectiveShiftDensity": "low|moderate|high",',
    '    "usesCounterexamples": "rare|occasional|common|dominant",',
    '    "selfQuestioning": "low|moderate|high",',
    '    "insightTiming": "early|moderate|late",',
    '    "usesAnalogies": "rare|occasional|common|dominant",',
    '    "closingMode": "conclusion|open_question|mixed"',
    "  },",
    '  "traitEvidence": {',
    '    "<traitKey>": [{ "exampleIndex": 1, "value": "<enum>" }]',
    "  }",
    "}",
    "Omit trait keys you cannot infer from examples. Do not invent enum values for unknown traits."
  ].join("\n");
}

export const TEST_DEVELOPMENT_TRAITS: DevelopmentTraits = {
  openingMode: "observation",
  perspectiveShiftDensity: "moderate",
  usesCounterexamples: "occasional",
  selfQuestioning: "high",
  insightTiming: "late",
  usesAnalogies: "rare",
  closingMode: "open_question"
};

export const TEST_DEVELOPMENT_TRAIT_EVIDENCE: TraitEvidenceDraft = {
  openingMode: [
    { exampleIndex: 1, value: "observation" },
    { exampleIndex: 2, value: "observation" }
  ],
  perspectiveShiftDensity: [
    { exampleIndex: 1, value: "moderate" },
    { exampleIndex: 2, value: "moderate" },
    { exampleIndex: 3, value: "moderate" }
  ],
  usesCounterexamples: [{ exampleIndex: 2, value: "occasional" }],
  selfQuestioning: [
    { exampleIndex: 1, value: "high" },
    { exampleIndex: 2, value: "high" }
  ],
  insightTiming: [
    { exampleIndex: 1, value: "late" },
    { exampleIndex: 2, value: "late" },
    { exampleIndex: 3, value: "late" }
  ],
  usesAnalogies: [{ exampleIndex: 3, value: "rare" }],
  closingMode: [
    { exampleIndex: 2, value: "open_question" },
    { exampleIndex: 3, value: "open_question" }
  ]
};

export const TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE: ArgumentDevelopmentExtractionResult = {
  development: {
    developmentProse:
      "The author opens from lived experience, tolerates doubt, tests ideas in concrete situations, and only then lands on a conclusion.",
    moveLabels: ["lived_experience", "doubt", "experimentation", "conclusion"],
    transitionTendencies: [
      { from: "lived_experience", to: "doubt", frequency: "common" },
      { from: "doubt", to: "experimentation", frequency: "common" },
      { from: "experimentation", to: "conclusion", frequency: "occasional" }
    ],
    epistemicPosture: "exploratory",
    structuralAntiPatterns: ["premature_thesis", "advocacy_arc"]
  },
  traits: TEST_DEVELOPMENT_TRAITS,
  traitEvidence: TEST_DEVELOPMENT_TRAIT_EVIDENCE
};

export const TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT: ArgumentDevelopmentExtractionResult = {
  development: {
    developmentProse:
      "O autor parte da experiência vivida, tolera a dúvida, testa ideias em situações concretas e só então chega a uma conclusão.",
    moveLabels: ["experiencia_vivida", "duvida", "experimentacao", "conclusao"],
    transitionTendencies: [
      { from: "experiencia_vivida", to: "duvida", frequency: "common" },
      { from: "duvida", to: "experimentacao", frequency: "common" },
      { from: "experimentacao", to: "conclusao", frequency: "occasional" }
    ],
    epistemicPosture: "exploratory",
    structuralAntiPatterns: ["tese_prematura", "arco_advocacia"]
  },
  traits: TEST_DEVELOPMENT_TRAITS,
  traitEvidence: TEST_DEVELOPMENT_TRAIT_EVIDENCE
};
