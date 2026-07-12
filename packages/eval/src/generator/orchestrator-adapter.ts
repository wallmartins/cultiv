import { Effect } from "effect";
import type {
  AIAdapterError,
  AIAdapterServiceContract,
  AIProviderRequest
} from "@my-ai-orchestrator/ai-adapters";
import {
  AIAdapterTransportError,
  createAIAdapterRegistry,
  createAIAdapterService,
  registerDefaultAIProviders
} from "@my-ai-orchestrator/ai-adapters";
import type { Context, ExecutionAdapter, StructuredPrompt } from "@my-ai-orchestrator/core";
import type { EvalJudgeAdapterOptions } from "../scorer/judge-adapter.js";
import { createEvalProviderTransport } from "../scorer/judge-adapter.js";

export interface EvalExecutionAdapterOptions extends EvalJudgeAdapterOptions {}

export function createEvalAIAdapterService(): AIAdapterServiceContract {
  const registry = registerDefaultAIProviders(createAIAdapterRegistry());
  return createAIAdapterService(registry);
}

export function createEvalExecutionAdapter(
  options: EvalExecutionAdapterOptions = {}
): ExecutionAdapter<AIAdapterError> {
  const provider = options.provider ?? process.env.EVAL_GENERATION_PROVIDER ?? "groq";
  const model = options.model ?? process.env.EVAL_GENERATION_MODEL ?? "llama-3.3-70b-versatile";
  const apiKey = options.apiKey ?? process.env[`${providerEnvPrefix(provider)}_API_KEY`];
  const baseUrl = options.baseUrl ?? process.env[`${providerEnvPrefix(provider)}_BASE_URL`] ?? undefined;
  const timeoutMs = options.timeoutMs ?? Number(process.env.EVAL_GENERATION_TIMEOUT_MS ?? "60000");

  const aiAdapters = createEvalAIAdapterService();
  const transport = createEvalProviderTransport({ apiKey, baseUrl });

  return {
    name: `eval-${provider}`,
    configure: () => undefined,
    execute: (instruction: string | StructuredPrompt, _context: Context) =>
      Effect.gen(function* () {
        const messages =
          typeof instruction === "string"
            ? [{ role: "user" as const, content: instruction }]
            : [
                { role: "system" as const, content: instruction.system },
                { role: "user" as const, content: instruction.user }
              ];

        const completion = yield* aiAdapters.complete({
          request: {
            provider,
            model,
            messages,
            temperature: 0.7,
            metadata: {
              purpose: "eval-generation",
              adapter: provider,
              model,
              timeoutMs
            }
          },
          transport
        });

        return completion.response.text;
      })
  };
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

export function createAIProviderRequestTransport(
  options: EvalExecutionAdapterOptions = {}
): (providerRequest: AIProviderRequest) => Effect.Effect<unknown, AIAdapterTransportError> {
  const provider = options.provider ?? process.env.EVAL_GENERATION_PROVIDER ?? "groq";
  const apiKey = options.apiKey ?? process.env[`${providerEnvPrefix(provider)}_API_KEY`];
  const baseUrl = options.baseUrl ?? process.env[`${providerEnvPrefix(provider)}_BASE_URL`] ?? undefined;
  return createEvalProviderTransport({ apiKey, baseUrl });
}
