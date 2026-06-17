import { Effect } from "effect";
import { normalizeCommonResponse } from "../response-normalization.js";
import type { AIProviderAdapter } from "../types.js";

export function createGroqAdapter(): AIProviderAdapter {
  return {
    name: "groq",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) =>
      Effect.succeed({
        provider: "groq",
        model: request.model,
        headers: {
          "content-type": "application/json"
        },
        metadata: request.metadata ?? {},
        body: {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP,
          stop: request.stop,
          stream: request.stream ?? false
        }
      }),
    normalizeResponse: (response, request) => normalizeCommonResponse("groq", request, response)
  };
}
