import { Effect } from "effect";
import { AIAdapterTransportError, type AIProviderRequest } from "@my-ai-orchestrator/ai-adapters";
import type { BackendConfig } from "../../config/config.js";

export interface BackendProviderTransport {
  readonly complete: (providerRequest: AIProviderRequest) => Effect.Effect<unknown, AIAdapterTransportError>;
}

type ProviderTransportFetch = typeof fetch;

export function createBackendProviderTransport(config: BackendConfig): BackendProviderTransport {
  if (config.environment === "test") {
    return createTestProviderTransport();
  }

  return {
    complete: (providerRequest) =>
      Effect.gen(function* () {
        const endpoint = resolveProviderEndpoint(config, providerRequest);
        const fetchTransport = resolveFetchTransport(providerRequest.provider);
        const headers = yield* Effect.try({
          try: () => resolveProviderHeaders(config, providerRequest),
          catch: (cause) =>
            cause instanceof AIAdapterTransportError
              ? cause
              : new AIAdapterTransportError({
                  provider: providerRequest.provider,
                  message: `Failed to configure provider "${providerRequest.provider}" transport`
                })
        });
        const response = yield* Effect.tryPromise({
          try: (signal) => {
            const timeoutSignal = createProviderTimeoutSignal(signal, providerRequest);
            return fetchTransport(endpoint, {
              method: "POST",
              headers,
              body: JSON.stringify(providerRequest.body),
              signal: timeoutSignal
            });
          },
          catch: (cause) =>
            new AIAdapterTransportError({
              provider: providerRequest.provider,
              message: cause instanceof Error ? cause.message : `Failed to reach provider "${providerRequest.provider}"`
            })
        });

        if (!response.ok) {
          const responseBody = yield* readResponseBody(response);
          return yield* Effect.fail(
            new AIAdapterTransportError({
              provider: providerRequest.provider,
              message: `Provider "${providerRequest.provider}" returned HTTP ${response.status}: ${responseBody}`
            })
          );
        }

        return yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (cause) =>
            new AIAdapterTransportError({
              provider: providerRequest.provider,
              message: `Provider "${providerRequest.provider}" returned an invalid JSON payload: ${String(cause)}`
            })
        });
      })
  };
}

function resolveFetchTransport(provider: string): ProviderTransportFetch {
  const candidate = globalThis.fetch;
  if (typeof candidate !== "function") {
    throw new AIAdapterTransportError({
      provider,
      message: 'Global fetch is not available in this runtime'
    });
  }

  return candidate;
}

function createTestProviderTransport(): BackendProviderTransport {
  return {
    complete: (providerRequest) =>
      Effect.succeed({
        choices: [
          {
            message: {
              content: renderTestResponse(providerRequest)
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          promptTokens: 32,
          completionTokens: 48,
          totalTokens: 80
        }
      })
  };
}

function resolveProviderEndpoint(config: BackendConfig, providerRequest: AIProviderRequest): string {
  if (providerRequest.provider === "openai") {
    return `${stripTrailingSlash(config.openAIBaseUrl ?? "https://api.openai.com/v1")}/chat/completions`;
  }

  if (providerRequest.provider === "anthropic") {
    return `${stripTrailingSlash(config.anthropicBaseUrl ?? "https://api.anthropic.com/v1")}/messages`;
  }

  if (providerRequest.provider === "gemini") {
    return `${stripTrailingSlash(config.geminiBaseUrl ?? "https://generativelanguage.googleapis.com/v1beta")}/models/${providerRequest.model}:generateContent`;
  }

  if (providerRequest.provider === "deepseek") {
    return `${stripTrailingSlash(config.deepSeekBaseUrl ?? "https://api.deepseek.com/v1")}/chat/completions`;
  }

  if (providerRequest.provider === "ollama") {
    return `${stripTrailingSlash(config.ollamaBaseUrl ?? "http://127.0.0.1:11434")}/api/generate`;
  }

  throw new Error(`Unsupported provider "${providerRequest.provider}"`);
}

function resolveProviderHeaders(
  config: BackendConfig,
  providerRequest: AIProviderRequest
): Record<string, string> {
  if (providerRequest.provider === "openai") {
    const apiKey = config.openAIApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'OpenAI transport requires "OPENAI_API_KEY"'
      });
    }

    return {
      ...providerRequest.headers,
      authorization: `Bearer ${apiKey}`
    };
  }

  if (providerRequest.provider === "anthropic") {
    const apiKey = config.anthropicApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'Anthropic transport requires "ANTHROPIC_API_KEY"'
      });
    }

    return {
      ...providerRequest.headers,
      "x-api-key": apiKey,
      "anthropic-version": config.anthropicVersion ?? "2023-06-01"
    };
  }

  if (providerRequest.provider === "gemini") {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'Gemini transport requires "GEMINI_API_KEY"'
      });
    }

    return {
      ...providerRequest.headers,
      "x-goog-api-key": apiKey
    };
  }

  if (providerRequest.provider === "deepseek") {
    const apiKey = config.deepSeekApiKey;
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: 'DeepSeek transport requires "DEEPSEEK_API_KEY"'
      });
    }

    return {
      ...providerRequest.headers,
      authorization: `Bearer ${apiKey}`
    };
  }

  return {
    ...providerRequest.headers
  };
}

function readResponseBody(response: Response): Effect.Effect<string, never> {
  return Effect.tryPromise({
    try: () => response.text(),
    catch: () => ""
  }).pipe(
    Effect.map((value) => (typeof value === "string" ? value : "")),
    Effect.orElseSucceed(() => "")
  );
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function renderTestResponse(providerRequest: AIProviderRequest): string {
  const bodyMessages = Array.isArray((providerRequest.body as Record<string, unknown>).messages)
    ? ((providerRequest.body as Record<string, unknown>).messages as Array<Record<string, unknown>>)
    : [];
  const lastMessage = bodyMessages.at(-1);
  const content = typeof lastMessage?.content === "string" ? lastMessage.content : providerRequest.model;
  return `provider:${providerRequest.provider}:${content}`;
}

function createProviderTimeoutSignal(
  signal: NonNullable<RequestInit["signal"]>,
  providerRequest: AIProviderRequest
): NonNullable<RequestInit["signal"]> {
  const timeoutMs = typeof providerRequest.metadata.timeoutMs === "number"
    ? providerRequest.metadata.timeoutMs
    : undefined;

  if (!timeoutMs || timeoutMs <= 0 || typeof AbortController === "undefined") {
    return signal;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener?.("abort", () => controller.abort(), { once: true });
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}
