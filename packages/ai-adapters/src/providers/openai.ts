import { Effect } from "effect";
import { normalizeCommonResponse } from "../response-normalization.js";
import type { AIProviderAdapter } from "../types.js";

export function createOpenAIAdapter(): AIProviderAdapter {
  return {
    name: "openai",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) =>
      Effect.succeed({
        provider: "openai",
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
    normalizeResponse: (response, request) => normalizeCommonResponse("openai", request, response)
  };
}
