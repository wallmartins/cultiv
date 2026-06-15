import { Effect } from "effect";
import { AIAdapterInvalidRequestError } from "../errors.js";
import { normalizeCommonResponse } from "../response-normalization.js";
import type { AIMessage, AIModelRequest, AIProviderAdapter } from "../types.js";

export function createAnthropicAdapter(): AIProviderAdapter {
  return {
    name: "anthropic",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) =>
      Effect.gen(function* () {
        const anthropicMessages = yield* toAnthropicMessages(request);
        const system = extractAnthropicSystemPrompt(request.messages);

        return {
          provider: "anthropic",
          model: request.model,
          headers: {
            "content-type": "application/json"
          },
          metadata: request.metadata ?? {},
          body: {
            model: request.model,
            messages: anthropicMessages,
            ...(system ? { system } : {}),
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            top_p: request.topP,
            stop_sequences: request.stop,
            stream: request.stream ?? false
          }
        };
      }),
    normalizeResponse: (response, request) => normalizeCommonResponse("anthropic", request, response)
  };
}

function extractAnthropicSystemPrompt(messages: readonly AIMessage[]): string | undefined {
  const systemMessages = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content.trim())
    .filter((content) => content.length > 0);

  return systemMessages.length > 0 ? systemMessages.join("\n\n") : undefined;
}

function toAnthropicMessages(
  request: AIModelRequest
): Effect.Effect<
  Array<{ readonly role: "user" | "assistant"; readonly content: string }>,
  AIAdapterInvalidRequestError
> {
  const anthropicMessages: Array<{ readonly role: "user" | "assistant"; readonly content: string }> = [];

  for (const message of request.messages) {
    if (message.role === "system") {
      continue;
    }

    if (message.role !== "user" && message.role !== "assistant") {
      return Effect.fail(
        new AIAdapterInvalidRequestError({
          message: `Anthropic adapter does not support message role "${message.role}" in the messages array`,
          request
        })
      );
    }

    anthropicMessages.push({
      role: message.role,
      content: message.content
    });
  }

  if (anthropicMessages.length === 0) {
    return Effect.fail(
      new AIAdapterInvalidRequestError({
        message: "Anthropic adapter requires at least one user or assistant message",
        request
      })
    );
  }

  return Effect.succeed(anthropicMessages);
}
