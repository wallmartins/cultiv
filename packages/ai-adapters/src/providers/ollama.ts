import { Effect } from "effect";
import { renderPrompt } from "../prompt-rendering.js";
import { normalizeCommonResponse } from "../response-normalization.js";
import type { AIProviderAdapter } from "../types.js";

export function createOllamaAdapter(): AIProviderAdapter {
  return {
    name: "ollama",
    supportsModel: (model) => model.length > 0,
    buildRequest: (request) =>
      Effect.succeed({
        provider: "ollama",
        model: request.model,
        headers: {
          "content-type": "application/json"
        },
        metadata: request.metadata ?? {},
        body: {
          model: request.model,
          prompt: renderPrompt(request.messages),
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens,
            top_p: request.topP,
            stop: request.stop
          },
          stream: request.stream ?? false
        }
      }),
    normalizeResponse: (response, request) => normalizeCommonResponse("ollama", request, response)
  };
}
