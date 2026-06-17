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
import { parseJsonFromLlmResponse } from "./voice-extraction-json.js";

export { ReasoningExtractionError } from "./voice-extraction-errors.js";

const decodeReasoningExtraction = Schema.decodeUnknown(ReasoningExtractionResultSchema);

const LANGUAGE_RETRY_SUFFIX =
  "\n\nRETRY: Your previous JSON used the wrong language. Rewrite every narrativeProse field in Brazilian Portuguese. Do not use English in narrativeProse.";

export interface ReasoningOutputLanguage {
  readonly primary: string;
  readonly bcp47: string;
  readonly label: string;
}

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

export function filterFormatExpressionsByCoverage(
  result: ReasoningExtractionResult,
  examplesByContentType: Readonly<Record<string, readonly VoiceExampleRecord[]>>
): ReasoningExtractionResult {
  const formatExpressions = Object.fromEntries(
    Object.entries(result.formatExpressions).filter(([contentType]) => {
      const count = examplesByContentType[contentType]?.length ?? 0;
      return count >= 2;
    })
  );

  return {
    core: result.core,
    formatExpressions
  };
}

export function extractReasoningSignature(args: {
  readonly examples: readonly VoiceExampleRecord[];
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}): Effect.Effect<ReasoningExtractionResult, ReasoningExtractionError> {
  return Effect.gen(function* () {
    const grouped = groupExamplesByContentType(args.examples);
    const outputLanguage = resolveReasoningOutputLanguage(args.examples);
    const systemPrompt = buildReasoningExtractionSystemPrompt(outputLanguage);
    let userPrompt = buildExtractionPrompt(grouped, args.examples, outputLanguage);

    let lastError: ReasoningExtractionError | undefined;

    for (const attempt of args.attempts) {
      for (let languageRetry = 0; languageRetry < 2; languageRetry += 1) {
        const completion = yield* Effect.either(
          args.aiAdapters.complete({
            request: {
              provider: attempt.provider,
              model: attempt.model,
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature: 0.2,
              metadata: {
                purpose: "reasoning-extraction",
                adapter: attempt.provider,
                model: attempt.model,
                ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
              }
            },
            transport: args.providerTransport.complete
          })
        );

        if (completion._tag === "Left") {
          lastError = new ReasoningExtractionError({ message: completion.left.message });
          break;
        }

        const parsed = yield* parseExtractionResponse(completion.right.response.text).pipe(Effect.either);
        if (parsed._tag === "Left") {
          lastError = parsed.left;
          break;
        }

        if (
          outputLanguage.primary === "pt"
          && languageRetry === 0
          && !isReasoningNarrativeLikelyPortuguese(parsed.right)
        ) {
          userPrompt = `${buildExtractionPrompt(grouped, args.examples, outputLanguage)}${LANGUAGE_RETRY_SUFFIX}`;
          continue;
        }

        return filterFormatExpressionsByCoverage(parsed.right, grouped);
      }
    }

    return yield* Effect.fail(lastError ?? new ReasoningExtractionError({ message: "Reasoning extraction failed" }));
  });
}

function parseExtractionResponse(
  content: string
): Effect.Effect<ReasoningExtractionResult, ReasoningExtractionError> {
  return Effect.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect.mapError((message) => new ReasoningExtractionError({ message }))
    );
    const decoded = yield* decodeReasoningExtraction(parsed).pipe(
      Effect.mapError(
        (error) =>
          new ReasoningExtractionError({
            message: error instanceof Error ? error.message : "Invalid reasoning extraction schema"
          })
      )
    );

    return normalizeExtractionResult(decoded);
  });
}

function normalizeExtractionResult(result: ReasoningExtractionResult): ReasoningExtractionResult {
  const formatExpressions = Object.fromEntries(
    Object.entries(result.formatExpressions).map(([contentType, profile]) => [
      contentType,
      {
        ...profile,
        contentType: profile.contentType || contentType
      }
    ])
  );

  return {
    core: {
      ...result.core,
      derivedAntiPatterns: [...new Set(result.core.derivedAntiPatterns.map((item) => item.trim()).filter(Boolean))]
    },
    formatExpressions
  };
}

export function buildReasoningExtractionMessages(
  examples: readonly VoiceExampleRecord[]
): { readonly system: string; readonly user: string } {
  const grouped = groupExamplesByContentType(examples);
  const outputLanguage = resolveReasoningOutputLanguage(examples);

  return {
    system: buildReasoningExtractionSystemPrompt(outputLanguage),
    user: buildExtractionPrompt(grouped, examples, outputLanguage)
  };
}

function buildExtractionPrompt(
  grouped: Readonly<Record<string, readonly VoiceExampleRecord[]>>,
  examples: readonly VoiceExampleRecord[],
  outputLanguage: ReasoningOutputLanguage
): string {
  const sections = Object.entries(grouped).map(([contentType, groupedExamples]) => {
    const exampleBlocks = groupedExamples
      .map(
        (example, index) =>
          `Example ${index + 1} (language: ${example.language}):\n${example.text.trim()}`
      )
      .join("\n\n");

    return `## Content type: ${contentType}\n${exampleBlocks}`;
  });

  return [
    `Dominant example language: ${outputLanguage.bcp47} (${outputLanguage.label}).`,
    `Write every narrativeProse field in ${outputLanguage.label}.`,
    "Analyze the author's reasoning patterns across all examples below.",
    "Return JSON only matching the agreed schema.",
    "Infer a single global core reasoning signature and per-content-type format expression profiles.",
    "Do not copy example text verbatim into narrative prose.",
    resolveReasoningLanguageInstruction(outputLanguage),
    "",
    ...sections
  ].join("\n");
}

export function normalizeExampleLanguage(language: string): string {
  const lower = language.trim().toLowerCase();
  if (lower.startsWith("pt")) {
    return "pt";
  }
  if (lower.startsWith("en")) {
    return "en";
  }

  return lower.split("-")[0] ?? lower;
}

export function resolvePrimaryExampleLanguage(
  examples: readonly VoiceExampleRecord[]
): string | undefined {
  const counts = new Map<string, number>();

  for (const example of examples.filter((item) => item.state === "active")) {
    const language = normalizeExampleLanguage(example.language);
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }

  let primary: string | undefined;
  let highestCount = 0;

  for (const [language, count] of counts) {
    if (count > highestCount) {
      primary = language;
      highestCount = count;
    }
  }

  return primary;
}

export function resolveReasoningOutputLanguage(
  examples: readonly VoiceExampleRecord[]
): ReasoningOutputLanguage {
  const primary = resolvePrimaryExampleLanguage(examples);

  if (primary === "pt") {
    return {
      primary: "pt",
      bcp47: "pt-BR",
      label: "Brazilian Portuguese"
    };
  }

  if (primary === "en") {
    return {
      primary: "en",
      bcp47: "en-US",
      label: "English"
    };
  }

  const dominantExample = examples.find((example) => example.state === "active");

  return {
    primary: primary ?? "unknown",
    bcp47: dominantExample?.language ?? "unknown",
    label: "the same language as the majority of examples"
  };
}

function resolveReasoningLanguageInstruction(outputLanguage: ReasoningOutputLanguage): string {
  if (outputLanguage.primary === "pt") {
    return "CRITICAL: Every narrativeProse field MUST be written in Brazilian Portuguese (pt-BR). English is not allowed in narrativeProse.";
  }

  if (outputLanguage.primary === "en") {
    return "CRITICAL: Every narrativeProse field MUST be written in English.";
  }

  return "CRITICAL: Every narrativeProse field MUST be written in the same language as the majority of examples.";
}

function buildReasoningExtractionSystemPrompt(outputLanguage: ReasoningOutputLanguage): string {
  return [
    "You extract an author's reasoning signature from writing examples.",
    "Respond with JSON only — no markdown fences or commentary.",
    `OUTPUT LANGUAGE: ${outputLanguage.label} (${outputLanguage.bcp47}).`,
    `Every narrativeProse value MUST be written in ${outputLanguage.label}.`,
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
    "  },",
    '  "formatExpressions": {',
    '    "<contentType>": {',
    '      "contentType": "<contentType>",',
    '      "narrativeProse": "string",',
    '      "register": "formal|informal|technical|conversational",',
    '      "openingStyle": "direct|contextual|provocative",',
    '      "technicalDensity": "low|medium|high"',
    "    }",
    "  }",
    "}"
  ].join("\n");
}

export function isLikelyPortugueseText(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  if (/^(The author|They |Author |This author|Opens with|LinkedIn posts stay)/i.test(normalized)) {
    return false;
  }

  return /[áàâãéêíóôõúç]/i.test(normalized) || /\b(que|com|para|não|autor|abordagem|observa|tom|estilo)\b/i.test(normalized);
}

export function isReasoningNarrativeLikelyPortuguese(result: ReasoningExtractionResult): boolean {
  const narratives = [
    result.core.narrativeProse,
    ...Object.values(result.formatExpressions).map((expression) => expression.narrativeProse)
  ];

  return narratives.every(isLikelyPortugueseText);
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
  },
  formatExpressions: {
    "linkedin-post": {
      contentType: "linkedin-post",
      narrativeProse: "LinkedIn posts stay conversational with short paragraphs and a direct opening.",
      register: "conversational",
      openingStyle: "direct",
      technicalDensity: "low"
    }
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
  },
  formatExpressions: {
    "linkedin-post": {
      contentType: "linkedin-post",
      narrativeProse:
        "Posts no LinkedIn mantêm tom conversacional, com parágrafos curtos e abertura direta.",
      register: "conversational",
      openingStyle: "direct",
      technicalDensity: "low"
    }
  }
};
