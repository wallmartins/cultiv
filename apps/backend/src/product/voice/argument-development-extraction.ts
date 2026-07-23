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
import { ArgumentDevelopmentExtractionError } from "./voice-extraction-errors.js";
import {
  ANTI_TOPIC_EXTRACTION_RULES,
  formatBriefForPrompt,
  type VoiceSignatureBrief
} from "./voice-signature-brief.js";
import {
  buildExampleBlocks,
  dedupeStrings,
  resolveLanguageInstruction,
  resolveReasoningOutputLanguage,
  runSignatureExtraction,
  type ReasoningOutputLanguage,
  type SignatureExtractionConfig
} from "./voice-signature-extraction.js";
import { sanitizeDevelopmentRaw } from "./voice-signature-sanitize.js";

export { ArgumentDevelopmentExtractionError } from "./voice-extraction-errors.js";

const LANGUAGE_RETRY_SUFFIX =
  "\n\nRETRY: Your previous JSON used the wrong language. Rewrite developmentProse in Brazilian Portuguese. Do not use English in developmentProse.";

const argumentDevelopmentExtractionConfig: SignatureExtractionConfig<
  ArgumentDevelopmentExtractionResult,
  ArgumentDevelopmentExtractionError
> = {
  purpose: "argument-development-extraction",
  buildMessages: (examples, outputLanguage, brief) => ({
    system: buildDevelopmentExtractionSystemPrompt(outputLanguage),
    user: buildDevelopmentExtractionPrompt(examples, outputLanguage, brief)
  }),
  decode: Schema.decodeUnknown(ArgumentDevelopmentExtractionResultSchema),
  normalize: normalizeDevelopmentExtractionResult,
  selectProse: (result) => result.development.developmentProse,
  languageRetrySuffix: LANGUAGE_RETRY_SUFFIX,
  sanitizeRaw: sanitizeDevelopmentRaw,
  schemaRepairSuffix: (message) =>
    `\n\nRETRY: Your previous JSON did not match the schema (${message.slice(0, 200)}). Return corrected JSON only. epistemicPosture MUST be one of the listed literals; every transitionTendencies[].frequency MUST be rare|occasional|common|dominant. No commentary.`,
  makeError: (message) => new ArgumentDevelopmentExtractionError({ message }),
  failMessage: "Argument development extraction failed",
  precondition: (activeExamples) =>
    activeExamples.length < 2
      ? Effect.fail(
          new ArgumentDevelopmentExtractionError({
            message: "At least two active examples are required for development extraction"
          })
        )
      : Effect.void
};

export function extractArgumentDevelopmentSignature(args: {
  readonly examples: readonly VoiceExampleRecord[];
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly brief?: VoiceSignatureBrief;
}): Effect.Effect<ArgumentDevelopmentExtractionResult, ArgumentDevelopmentExtractionError> {
  return runSignatureExtraction(argumentDevelopmentExtractionConfig, args);
}

export function buildDevelopmentExtractionMessages(
  examples: readonly VoiceExampleRecord[],
  brief?: VoiceSignatureBrief
): { readonly system: string; readonly user: string } {
  const activeExamples = examples.filter((example) => example.state === "active");
  const outputLanguage = resolveReasoningOutputLanguage(activeExamples);

  return {
    system: buildDevelopmentExtractionSystemPrompt(outputLanguage),
    user: buildDevelopmentExtractionPrompt(activeExamples, outputLanguage, brief)
  };
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
      moveLabels: dedupeStrings(developmentCore.moveLabels),
      structuralAntiPatterns: dedupeStrings(developmentCore.structuralAntiPatterns),
      transitionTendencies: developmentCore.transitionTendencies.filter(
        (tendency) => tendency.from.trim().length > 0 && tendency.to.trim().length > 0
      )
    }
  };
}

function buildDevelopmentExtractionPrompt(
  examples: readonly VoiceExampleRecord[],
  outputLanguage: ReasoningOutputLanguage,
  brief?: VoiceSignatureBrief
): string {
  return [
    `Dominant example language: ${outputLanguage.bcp47} (${outputLanguage.label}).`,
    `Write developmentProse and moveLabels in ${outputLanguage.label}.`,
    "Analyze how the author develops texts — argumentative moves, transitions, epistemic posture while writing, and structural habits.",
    "Synthesize patterns across ALL examples, especially reasoning_reflection, argument_development, and format_adaptation steps.",
    "Do NOT infer cognitive traits (certainty, judgment) — focus on how the text unfolds.",
    "Do NOT impose a fixed phase template; infer moves from examples only.",
    ANTI_TOPIC_EXTRACTION_RULES,
    brief ? formatBriefForPrompt(brief) : "",
    "Return JSON only matching the agreed schema.",
    resolveLanguageInstruction(outputLanguage, {
      pt: "CRITICAL: developmentProse and moveLabels MUST be written in Brazilian Portuguese (pt-BR). Use short snake_case slugs in Portuguese (for example experiencia_vivida, duvida) or natural Portuguese phrases — never English move labels when examples are Portuguese.",
      en: "CRITICAL: developmentProse and moveLabels MUST be written in English.",
      fallback: "CRITICAL: developmentProse and moveLabels MUST match the majority example language."
    }),
    "",
    buildExampleBlocks(examples)
  ]
    .filter((section) => section.length > 0)
    .join("\n");
}

function buildDevelopmentExtractionSystemPrompt(outputLanguage: ReasoningOutputLanguage): string {
  return [
    "You extract how an author develops texts from writing examples.",
    "Respond with JSON only — no markdown fences or commentary.",
    `OUTPUT LANGUAGE: ${outputLanguage.label} (${outputLanguage.bcp47}).`,
    `developmentProse and moveLabels MUST be written in ${outputLanguage.label}.`,
    "developmentProse must describe the author's typical argumentative path, not the content of any single example.",
    "moveLabels are author-specific short labels (snake_case slugs or brief phrases) in the output language — not schema enum literals.",
    "Enum fields remain schema literals in English.",
    "Schema:",
    "{",
    '  "development": {',
    '    "developmentProse": "string",',
    '    "moveLabels": ["author-specific move label"],',
    '    "transitionTendencies": [{ "from": "move", "to": "move", "frequency": "rare|occasional|common|dominant" }],',
    '    "epistemicPosture": "exploratory|investigative|advocacy|expository|instructive|experiential|promotional|not_applicable",',
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
