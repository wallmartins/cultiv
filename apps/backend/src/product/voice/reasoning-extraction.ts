import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  ReasoningExtractionResultSchema,
  type ReasoningExtractionResult
} from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { AIPolicyProviderModelAttempt } from "../ai-policy/ai-policy-types.js";
import { ReasoningExtractionError } from "./voice-extraction-errors.js";
import {
  ANTI_TOPIC_EXTRACTION_RULES,
  formatBriefForPrompt,
  type VoiceSignatureBrief
} from "./voice-signature-brief.js";
import {
  buildExampleBlocks,
  dedupeStrings,
  isLikelyPortugueseText,
  resolveLanguageInstruction,
  resolveReasoningOutputLanguage,
  runSignatureExtraction,
  type ReasoningOutputLanguage,
  type SignatureExtractionConfig
} from "./voice-signature-extraction.js";

export { ReasoningExtractionError } from "./voice-extraction-errors.js";
export {
  normalizeExampleLanguage,
  resolvePrimaryExampleLanguage,
  resolveReasoningOutputLanguage,
  isLikelyPortugueseText,
  type ReasoningOutputLanguage
} from "./voice-signature-extraction.js";

const LANGUAGE_RETRY_SUFFIX =
  "\n\nRETRY: Your previous JSON used the wrong language. Rewrite every narrativeProse field in Brazilian Portuguese. Do not use English in narrativeProse.";

const reasoningExtractionConfig: SignatureExtractionConfig<ReasoningExtractionResult, ReasoningExtractionError> = {
  purpose: "reasoning-extraction",
  buildMessages: (examples, outputLanguage, brief) => ({
    system: buildReasoningExtractionSystemPrompt(outputLanguage),
    user: buildExtractionPrompt(examples, outputLanguage, brief)
  }),
  decode: Schema.decodeUnknown(ReasoningExtractionResultSchema),
  normalize: normalizeExtractionResult,
  selectProse: (result) => result.core.narrativeProse,
  languageRetrySuffix: LANGUAGE_RETRY_SUFFIX,
  makeError: (message) => new ReasoningExtractionError({ message }),
  failMessage: "Reasoning extraction failed"
};

export function groupExamplesByContentType(
  examples: readonly VoiceExampleRecord[]
): Readonly<Record<string, readonly VoiceExampleRecord[]>> {
  const groups = new Map<string, VoiceExampleRecord[]>();

  for (const example of examples.filter((item) => item.state === "active")) {
    const contentTypes =
      example.explicitContentType
        ? [example.explicitContentType]
        : (example.effectiveContentTypeHints?.length ?? 0) > 0
          ? [...example.effectiveContentTypeHints]
          : ["general"];

    for (const contentType of contentTypes) {
      const bucket = groups.get(contentType) ?? [];
      bucket.push(example);
      groups.set(contentType, bucket);
    }
  }

  return Object.fromEntries(groups.entries());
}

export function extractReasoningSignature(args: {
  readonly examples: readonly VoiceExampleRecord[];
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly brief?: VoiceSignatureBrief;
}): Effect.Effect<ReasoningExtractionResult, ReasoningExtractionError> {
  return runSignatureExtraction(reasoningExtractionConfig, args);
}

function normalizeExtractionResult(result: ReasoningExtractionResult): ReasoningExtractionResult {
  return {
    core: {
      ...result.core,
      derivedAntiPatterns: dedupeStrings(result.core.derivedAntiPatterns)
    }
  };
}

export function buildReasoningExtractionMessages(
  examples: readonly VoiceExampleRecord[],
  brief?: VoiceSignatureBrief
): { readonly system: string; readonly user: string } {
  const activeExamples = examples.filter((example) => example.state === "active");
  const outputLanguage = resolveReasoningOutputLanguage(activeExamples);

  return {
    system: buildReasoningExtractionSystemPrompt(outputLanguage),
    user: buildExtractionPrompt(activeExamples, outputLanguage, brief)
  };
}

function buildExtractionPrompt(
  examples: readonly VoiceExampleRecord[],
  outputLanguage: ReasoningOutputLanguage,
  brief?: VoiceSignatureBrief
): string {
  return [
    `Dominant example language: ${outputLanguage.bcp47} (${outputLanguage.label}).`,
    `Write every narrativeProse field in ${outputLanguage.label}.`,
    "Analyze the author's reasoning patterns across all examples below.",
    "Return JSON only matching the agreed schema.",
    "Infer a single global core reasoning signature.",
    ANTI_TOPIC_EXTRACTION_RULES,
    brief ? formatBriefForPrompt(brief) : "",
    resolveLanguageInstruction(outputLanguage, {
      pt: "CRITICAL: Every narrativeProse field MUST be written in Brazilian Portuguese (pt-BR). English is not allowed in narrativeProse.",
      en: "CRITICAL: Every narrativeProse field MUST be written in English.",
      fallback: "CRITICAL: Every narrativeProse field MUST be written in the same language as the majority of examples."
    }),
    "",
    buildExampleBlocks(examples)
  ]
    .filter((section) => section.length > 0)
    .join("\n");
}

function buildReasoningExtractionSystemPrompt(outputLanguage: ReasoningOutputLanguage): string {
  return [
    "You extract an author's reasoning signature from writing examples.",
    "Respond with JSON only — no markdown fences or commentary.",
    `OUTPUT LANGUAGE: ${outputLanguage.label} (${outputLanguage.bcp47}).`,
    `Every narrativeProse value MUST be written in ${outputLanguage.label}.`,
    "core.narrativeProse must describe cognitive and epistemic habits that transfer across topics.",
    "Never summarize what the examples are about.",
    "Enum fields remain the schema literals in English (for example low|moderate|high).",
    "derivedAntiPatterns may stay short phrase labels in the example language.",
    "Schema:",
    "{",
    '  "core": {',
    '    "narrativeProse": "string",',
    '    "certaintyLevel": "low|moderate|high",',
    '    "judgmentFrequency": "low|moderate|high",',
    '    "conclusionPace": "slow|moderate|fast",',
    '    "readerRelationship": "peer|mentor|observer|collaborator|guide",',
    '    "authoritySource": "personal_observation|lived_experience|data|reference|practice",',
    '    "derivedAntiPatterns": ["string"]',
    "  }",
    "}"
  ].join("\n");
}

export function isReasoningNarrativeLikelyPortuguese(result: ReasoningExtractionResult): boolean {
  return isLikelyPortugueseText(result.core.narrativeProse);
}

export function extractSignaturePhrases(texts: readonly string[]): {
  readonly signatureOpenings: readonly string[];
  readonly signatureClosings: readonly string[];
} {
  const signatureOpenings: string[] = [];
  const signatureClosings: string[] = [];
  const seenOpenings = new Set<string>();
  const seenClosings = new Set<string>();

  for (const text of texts) {
    const trimmed = text.trim();
    if (!trimmed) {
      continue;
    }

    const sentences = trimmed
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
    const opening = sentences[0];
    const closing = sentences.length > 0 ? sentences[sentences.length - 1] : undefined;

    if (opening && !seenOpenings.has(opening) && signatureOpenings.length < 5) {
      seenOpenings.add(opening);
      signatureOpenings.push(opening);
    }

    if (
      closing
      && closing !== opening
      && !seenClosings.has(closing)
      && signatureClosings.length < 5
    ) {
      seenClosings.add(closing);
      signatureClosings.push(closing);
    }
  }

  return { signatureOpenings, signatureClosings };
}

export function extractSignaturePhrasesFromExamples(
  examples: readonly VoiceExampleRecord[]
): {
  readonly signatureOpenings: readonly string[];
  readonly signatureClosings: readonly string[];
} {
  const texts = examples
    .filter((example) => example.state === "active")
    .map((example) => example.text)
    .filter((text) => text.trim().length > 0);

  return extractSignaturePhrases(texts);
}

export const TEST_REASONING_EXTRACTION_FIXTURE: ReasoningExtractionResult = {
  core: {
    narrativeProse:
      "The author observes before judging, lets tension build through concrete situations, and arrives at insight without prescribing universal rules.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: ["generic linkedin tone", "numbered thesis proof list"]
  }
};

export const TEST_REASONING_EXTRACTION_FIXTURE_PT: ReasoningExtractionResult = {
  core: {
    narrativeProse:
      "O autor observa antes de julgar, deixa a tensão crescer em situações concretas e chega a insights sem prescrever regras universais.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: ["tom genérico de linkedin", "lista numerada de tese e prova"]
  }
};
