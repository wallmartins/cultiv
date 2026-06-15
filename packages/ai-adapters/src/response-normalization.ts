import { Effect } from "effect";
import { AIAdapterInvalidResponseError } from "./errors.js";
import type { AIModelRequest, AIModelResponse, AIProviderName, AIUsage } from "./types.js";

export function normalizeCommonResponse(
  provider: AIProviderName,
  request: AIModelRequest,
  response: unknown
): Effect.Effect<AIModelResponse, AIAdapterInvalidResponseError> {
  const text = extractText(response) ?? extractAnthropicText(response) ?? extractGeminiText(response) ?? extractOllamaText(response);

  if (!text) {
    return Effect.fail(
      new AIAdapterInvalidResponseError({
        provider: String(provider),
        message: "Provider response did not include any extractable text",
        response
      })
    );
  }

  return Effect.succeed({
    provider,
    model: request.model,
    text,
    usage: extractUsage(response),
    raw: response,
    finishReason: extractFinishReason(response),
    metadata: request.metadata
  });
}

function extractText(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  if (typeof record.text === "string") {
    return record.text;
  }
  if (typeof record.output === "string") {
    return record.output;
  }
  if (typeof record.content === "string") {
    return record.content;
  }
  if (Array.isArray(record.choices)) {
    const first = record.choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") {
      return message.content;
    }
    if (typeof first?.text === "string") {
      return first.text;
    }
  }

  return undefined;
}

function extractAnthropicText(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  if (!Array.isArray(record.content)) {
    return undefined;
  }

  return record.content
    .map((block) => (block && typeof block === "object" ? (block as Record<string, unknown>).text : undefined))
    .filter((value): value is string => typeof value === "string")
    .join("");
}

function extractGeminiText(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  if (!Array.isArray(record.candidates)) {
    return undefined;
  }

  const text = record.candidates
    .flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") {
        return [];
      }

      const content = (candidate as Record<string, unknown>).content;
      if (!content || typeof content !== "object") {
        return [];
      }

      const parts = (content as Record<string, unknown>).parts;
      return Array.isArray(parts) ? parts : [];
    })
    .map((part) => (part && typeof part === "object" ? (part as Record<string, unknown>).text : undefined))
    .filter((value): value is string => typeof value === "string")
    .join("");

  return text.length > 0 ? text : undefined;
}

function extractOllamaText(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  if (typeof record.response === "string") {
    return record.response;
  }

  return undefined;
}

function extractUsage(response: unknown): AIUsage | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  const usage = (record.usage as Record<string, unknown> | undefined) ?? (record.tokenUsage as Record<string, unknown> | undefined);
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: toNumber(usage.inputTokens ?? usage.promptTokens ?? usage.input_tokens),
    outputTokens: toNumber(usage.outputTokens ?? usage.completionTokens ?? usage.output_tokens),
    totalTokens: toNumber(usage.totalTokens ?? usage.total_tokens)
  };
}

function extractFinishReason(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  if (typeof record.finishReason === "string") {
    return record.finishReason;
  }
  if (typeof record.finish_reason === "string") {
    return record.finish_reason;
  }
  if (Array.isArray(record.choices)) {
    const first = record.choices[0] as Record<string, unknown> | undefined;
    if (typeof first?.finish_reason === "string") {
      return first.finish_reason;
    }
  }
  if (Array.isArray(record.candidates)) {
    const first = record.candidates[0] as Record<string, unknown> | undefined;
    if (typeof first?.finishReason === "string") {
      return first.finishReason;
    }
  }

  return undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
