import { Effect } from "effect";
import { normalizeCommonResponse } from "../response-normalization.js";
import type { AIProviderAdapter, AIProviderName } from "../types.js";

export interface OpenAiCompatibleProviderConfig {
  readonly name: AIProviderName;
  readonly baseUrl: string;
  readonly defaultModel?: string;
  readonly supportsModel?: (model: string) => boolean;
}

export function createOpenAiCompatibleProvider(config: OpenAiCompatibleProviderConfig): AIProviderAdapter {
  const supportsModel = config.supportsModel ?? ((model) => model.length > 0);

  return {
    name: config.name,
    supportsModel,
    buildRequest: (request) => {
      const model = request.model.length > 0 ? request.model : (config.defaultModel ?? request.model);

      return Effect.succeed({
        provider: config.name,
        model,
        headers: {
          "content-type": "application/json"
        },
        metadata: request.metadata ?? {},
        body: {
          model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP,
          stop: request.stop,
          stream: request.stream ?? false
        }
      });
    },
    normalizeResponse: (response, request) => normalizeCommonResponse(config.name, request, response)
  };
}
