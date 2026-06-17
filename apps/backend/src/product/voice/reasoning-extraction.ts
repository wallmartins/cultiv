import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  ReasoningExtractionResultSchema,
  type ReasoningExtractionResult
} from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { AIPolicyProviderModelAttempt } from "../ai-policy/ai-policy-types.js";

export class ReasoningExtractionError extends Error {
  readonly _tag = "ReasoningExtractionError";

  constructor(message: string) {
    super(message);
    this.name = "ReasoningExtractionError";
  }
}

const decodeReasoningExtraction = Schema.decodeUnknown(ReasoningExtractionResultSchema);

export function groupExamplesByContentType(
  examples: readonly VoiceExampleRecord[]
): Readonly<Record<string, readonly VoiceExampleRecord[]>> {
  const groups = new Map<string, VoiceExampleRecord[]>();

  for (const example of examples.filter((item) => item.state === "active")) {
    const contentTypes =
      example.explicitContentType
        ? [example.explicitContentType]
        : example.effectiveContentTypeHints.length > 0
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
    const promptPayload = buildExtractionPrompt(grouped);

    let lastError: ReasoningExtractionError | undefined;

    for (const attempt of args.attempts) {
      const completion = yield* Effect.either(
        args.aiAdapters.complete({
          request: {
            provider: attempt.provider,
            model: attempt.model,
            messages: [
              {
                role: "system",
                content: REASONING_EXTRACTION_SYSTEM_PROMPT
              },
              {
                role: "user",
                content: promptPayload
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
        lastError = new ReasoningExtractionError(completion.left.message);
        continue;
      }

      const parsed = yield* parseExtractionResponse(completion.right.response.text).pipe(Effect.either);
      if (parsed._tag === "Right") {
        return filterFormatExpressionsByCoverage(parsed.right, grouped);
      }

      lastError = parsed.left;
    }

    return yield* Effect.fail(lastError ?? new ReasoningExtractionError("Reasoning extraction failed"));
  });
}

function parseExtractionResponse(
  content: string
): Effect.Effect<ReasoningExtractionResult, ReasoningExtractionError> {
  return Effect.gen(function* () {
    const jsonText = extractJsonObject(content);
    const decoded = yield* decodeReasoningExtraction(JSON.parse(jsonText)).pipe(
      Effect.mapError(
        (error) =>
          new ReasoningExtractionError(
            error instanceof Error ? error.message : "Invalid reasoning extraction schema"
          )
      )
    );

    return normalizeExtractionResult(decoded);
  }).pipe(
    Effect.catchAll((error: unknown) =>
      Effect.fail(
        error instanceof ReasoningExtractionError
          ? error
          : new ReasoningExtractionError(
              error instanceof Error ? error.message : "Failed to parse reasoning extraction JSON"
            )
      )
    )
  );
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

function buildExtractionPrompt(
  grouped: Readonly<Record<string, readonly VoiceExampleRecord[]>>
): string {
  const sections = Object.entries(grouped).map(([contentType, examples]) => {
    const exampleBlocks = examples
      .map((example, index) => `Example ${index + 1}:\n${example.text.trim()}`)
      .join("\n\n");

    return `## Content type: ${contentType}\n${exampleBlocks}`;
  });

  return [
    "Analyze the author's reasoning patterns across all examples below.",
    "Return JSON only matching the agreed schema.",
    "Infer a single global core reasoning signature and per-content-type format expression profiles.",
    "Do not copy example text verbatim into narrative prose.",
    "",
    ...sections
  ].join("\n");
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

const REASONING_EXTRACTION_SYSTEM_PROMPT = [
  "You extract an author's reasoning signature from writing examples.",
  "Respond with JSON only — no markdown fences or commentary.",
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
