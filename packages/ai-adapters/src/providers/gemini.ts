import { Effect } from "effect";
import { AIAdapterInvalidRequestError } from "../errors.js";
import { normalizeCommonResponse } from "../response-normalization.js";
import type { AIModelRequest, AIProviderAdapter } from "../types.js";

export function createGeminiAdapter(): AIProviderAdapter {
  return {
    name: "gemini",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) =>
      Effect.gen(function* () {
        const contents = yield* toGeminiContents(request);

        return {
          provider: "gemini",
          model: request.model,
          headers: {
            "content-type": "application/json"
          },
          metadata: request.metadata ?? {},
          body: {
            contents,
            generationConfig: {
              temperature: request.temperature,
              topP: request.topP,
              maxOutputTokens: request.maxTokens,
              stopSequences: request.stop
            },
            // Provider-native web grounding (FU-2). `google_search` is the current Gemini 2.x/3.x tool
            // name (the 1.5-era name was `google_search_retrieval`); the practice-profile chain runs
            // gemini-3.1/2.5, so this is the right form. Only emitted when a caller asks to ground.
            ...(request.grounding?.webSearch ? { tools: [{ google_search: {} }] } : {})
          }
        };
      }),
    normalizeResponse: (response, request) => normalizeCommonResponse("gemini", request, response)
  };
}

function toGeminiContents(
  request: AIModelRequest
): Effect.Effect<
  Array<{ readonly role: "user" | "model"; readonly parts: Array<{ readonly text: string }> }>,
  AIAdapterInvalidRequestError
> {
  const contents: Array<{ readonly role: "user" | "model"; readonly parts: Array<{ readonly text: string }> }> = [];

  for (const message of request.messages) {
    if (message.role === "system") {
      contents.push({
        role: "user",
        parts: [{ text: `System instruction:\n${message.content}` }]
      });
      continue;
    }

    if (message.role !== "user" && message.role !== "assistant") {
      return Effect.fail(
        new AIAdapterInvalidRequestError({
          message: `Gemini adapter does not support message role "${message.role}"`,
          request
        })
      );
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    });
  }

  if (contents.length === 0) {
    return Effect.fail(
      new AIAdapterInvalidRequestError({
        message: "Gemini adapter requires at least one message",
        request
      })
    );
  }

  return Effect.succeed(contents);
}
