import { Effect } from "effect";
import {
  AIAdapterTransportError,
  type AIAdapterServiceContract,
  type AIProviderRequest,
  createAIAdapterRegistry,
  createAIAdapterService,
  registerDefaultAIProviders
} from "@my-ai-orchestrator/ai-adapters";
import type { JudgeAdapter, JudgeMessage } from "./judge.js";

export interface EvalJudgeAdapterOptions {
  readonly provider?: string;
  readonly model?: string;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
}

export interface EvalProviderTransportConfig {
  readonly apiKey?: string;
  readonly baseUrl?: string;
}

export function createEvalProviderTransport(
  config: EvalProviderTransportConfig = {}
): (providerRequest: AIProviderRequest) => Effect.Effect<unknown, AIAdapterTransportError> {
  return (providerRequest) =>
    Effect.gen(function* () {
      const endpoint = resolveProviderEndpoint(providerRequest, config.baseUrl);
      const headers = resolveProviderHeaders(providerRequest, config.apiKey);
      const fetchTransport = resolveFetchTransport(providerRequest.provider);

      const response = yield* Effect.tryPromise({
        try: (signal) =>
          fetchTransport(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(providerRequest.body),
            signal
          }),
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
    });
}

export function createAIAdapterServiceContract(
  registry = registerDefaultAIProviders(createAIAdapterRegistry())
): AIAdapterServiceContract {
  return createAIAdapterService(registry);
}

export function createJudgeAdapter(options: EvalJudgeAdapterOptions = {}): JudgeAdapter {
  const provider = options.provider ?? process.env.EVAL_JUDGE_PROVIDER ?? "groq";
  const model = options.model ?? process.env.EVAL_JUDGE_MODEL ?? "llama-3.3-70b-versatile";
  const apiKey = options.apiKey ?? resolveApiKey(provider);
  const baseUrl = options.baseUrl ?? process.env[`${providerEnvPrefix(provider)}_BASE_URL`] ?? undefined;
  const timeoutMs = options.timeoutMs ?? Number(process.env.EVAL_JUDGE_TIMEOUT_MS ?? "30000");

  const aiAdapters = createAIAdapterServiceContract();
  const transport = createEvalProviderTransport({ apiKey, baseUrl });

  return {
    provider,
    model,
    complete: async (messages: readonly JudgeMessage[]) => {
      const completion = await Effect.runPromise(
        aiAdapters.complete({
          request: {
            provider,
            model,
            messages: messages.map((message) => ({
              role: message.role,
              content: message.content
            })),
            temperature: 0,
            metadata: {
              purpose: "voice-judge",
              adapter: provider,
              model,
              timeoutMs
            }
          },
          transport
        })
      );

      return { text: completion.response.text };
    }
  };
}

function resolveApiKey(provider: string): string | undefined {
  const envKey = `${providerEnvPrefix(provider)}_API_KEY`;
  return process.env[envKey];
}

function providerEnvPrefix(provider: string): string {
  const normalized = provider.toLowerCase();
  switch (normalized) {
    case "openai":
      return "OPENAI";
    case "anthropic":
      return "ANTHROPIC";
    case "gemini":
      return "GEMINI";
    case "deepseek":
      return "DEEPSEEK";
    case "groq":
      return "GROQ";
    case "ollama":
      return "OLLAMA";
    default:
      return provider.toUpperCase();
  }
}

function resolveProviderEndpoint(providerRequest: AIProviderRequest, baseUrl?: string): string {
  const provider = providerRequest.provider.toLowerCase();

  if (provider === "openai") {
    return `${stripTrailingSlash(baseUrl ?? "https://api.openai.com/v1")}/chat/completions`;
  }

  if (provider === "anthropic") {
    return `${stripTrailingSlash(baseUrl ?? "https://api.anthropic.com/v1")}/messages`;
  }

  if (provider === "gemini") {
    return `${stripTrailingSlash(baseUrl ?? "https://generativelanguage.googleapis.com/v1beta")}/models/${providerRequest.model}:generateContent`;
  }

  if (provider === "deepseek") {
    return `${stripTrailingSlash(baseUrl ?? "https://api.deepseek.com/v1")}/chat/completions`;
  }

  if (provider === "groq") {
    return `${stripTrailingSlash(baseUrl ?? "https://api.groq.com/openai/v1")}/chat/completions`;
  }

  if (provider === "ollama") {
    return `${stripTrailingSlash(baseUrl ?? "http://127.0.0.1:11434")}/api/generate`;
  }

  throw new AIAdapterTransportError({
    provider: providerRequest.provider,
    message: `Unsupported provider "${providerRequest.provider}"`
  });
}

function resolveProviderHeaders(providerRequest: AIProviderRequest, apiKey?: string): Record<string, string> {
  const provider = providerRequest.provider.toLowerCase();
  const headers: Record<string, string> = { ...providerRequest.headers };

  if (provider === "openai" || provider === "deepseek" || provider === "groq") {
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: `${providerEnvPrefix(provider)}_API_KEY is required for ${provider} judge transport`
      });
    }
    headers.authorization = `Bearer ${apiKey}`;
  }

  if (provider === "anthropic") {
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: `ANTHROPIC_API_KEY is required for anthropic judge transport`
      });
    }
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  if (provider === "gemini") {
    if (!apiKey) {
      throw new AIAdapterTransportError({
        provider: providerRequest.provider,
        message: `GEMINI_API_KEY is required for gemini judge transport`
      });
    }
    headers["x-goog-api-key"] = apiKey;
  }

  return headers;
}

function resolveFetchTransport(provider: string): typeof fetch {
  const candidate = globalThis.fetch;
  if (typeof candidate !== "function") {
    throw new AIAdapterTransportError({
      provider,
      message: "Global fetch is not available in this runtime"
    });
  }
  return candidate;
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
