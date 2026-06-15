import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  AIAdapterService,
  AIAdapterServiceContract,
  AIAdapterInvalidRequestError,
  createAIAdapterRegistry,
  createAIAdapterServiceLayer,
  createAIAdapterService,
  createAnthropicAdapter,
  createDeepSeekAdapter,
  createGeminiAdapter,
  createOpenAIAdapter,
  createOllamaAdapter,
  normalizeCommonResponse,
  registerDefaultAIProviders,
  renderPrompt,
  resolveAdapter,
  AIAdapterProviderNotFoundError
} from "../../packages/ai-adapters/src/index.js";

describe("ai-adapters package", () => {
  it("renders prompts and normalizes common provider responses", () => {
    const prompt = renderPrompt([
      { role: "system", content: "You are helpful" },
      { role: "user", content: "Write a summary" }
    ]);

    const response = Effect.runSync(
      normalizeCommonResponse(
        "openai",
        {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "hello" }]
        },
        {
          choices: [{ message: { content: "Hello world" }, finish_reason: "stop" }],
          usage: { promptTokens: 5, completionTokens: 2, totalTokens: 7 }
        }
      )
    );

    expect(prompt).toContain("[system] You are helpful");
    expect(prompt).toContain("[user] Write a summary");
    expect(response.text).toBe("Hello world");
    expect(response.usage?.totalTokens).toBe(7);
  });

  it("normalizes Gemini generateContent responses", () => {
    const response = Effect.runSync(
      normalizeCommonResponse(
        "gemini",
        {
          provider: "gemini",
          model: "gemini-1.5-pro",
          messages: [{ role: "user", content: "hello" }]
        },
        {
          candidates: [
            {
              content: {
                parts: [{ text: "Hello " }, { text: "world" }]
              },
              finishReason: "STOP"
            }
          ]
        }
      )
    );

    expect(response.text).toBe("Hello world");
    expect(response.finishReason).toBe("STOP");
  });

  it("registers providers and builds provider-specific requests", () => {
    const registry = registerDefaultAIProviders(createAIAdapterRegistry());
    const openai = Effect.runSync(resolveAdapter(registry, "openai"));
    const anthropic = Effect.runSync(resolveAdapter(registry, "anthropic"));
    const gemini = Effect.runSync(resolveAdapter(registry, "gemini"));
    const deepseek = Effect.runSync(resolveAdapter(registry, "deepseek"));
    const ollama = Effect.runSync(resolveAdapter(registry, "ollama"));

    const request = {
      provider: "ollama" as const,
      model: "llama3.1",
      messages: [{ role: "user" as const, content: "Summarize the repo" }],
      temperature: 0.3,
      maxTokens: 128
    };

    expect(openai.name).toBe("openai");
    expect(gemini.name).toBe("gemini");
    expect(deepseek.name).toBe("deepseek");
    expect(
      Effect.runSync(
        anthropic.buildRequest({
          provider: "anthropic",
          model: "claude-3-5-sonnet-latest",
          messages: [
            { role: "system", content: "You are the backend execution adapter." },
            { role: "user", content: "Summarize the repo" }
          ],
          temperature: 0.2,
          maxTokens: 256
        })
      ).body
    ).toMatchObject({
      model: "claude-3-5-sonnet-latest",
      system: "You are the backend execution adapter.",
      messages: [{ role: "user", content: "Summarize the repo" }],
      temperature: 0.2,
      max_tokens: 256
    });
    expect(
      Effect.runSync(
        gemini.buildRequest({
          provider: "gemini",
          model: "gemini-1.5-pro",
          messages: [
            { role: "system", content: "You are the backend execution adapter." },
            { role: "user", content: "Summarize the repo" }
          ],
          temperature: 0.2,
          maxTokens: 256
        })
      ).body
    ).toMatchObject({
      contents: [
        { role: "user", parts: [{ text: "System instruction:\nYou are the backend execution adapter." }] },
        { role: "user", parts: [{ text: "Summarize the repo" }] }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256
      }
    });
    expect(
      Effect.runSync(
        deepseek.buildRequest({
          provider: "deepseek",
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Summarize the repo" }],
          temperature: 0.3,
          maxTokens: 128
        })
      ).body
    ).toMatchObject({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Summarize the repo" }],
      temperature: 0.3,
      max_tokens: 128
    });
    expect(Effect.runSync(ollama.buildRequest(request)).body).toMatchObject({
      model: "llama3.1",
      prompt: "[user] Summarize the repo",
      options: {
        temperature: 0.3,
        num_predict: 128
      }
    });
  });

  it("runs a full adapter completion flow through Effect services", async () => {
    const registry = registerDefaultAIProviders(createAIAdapterRegistry());
    const service = createAIAdapterService(registry);

    const result = await Effect.runPromise(
      service.complete({
        request: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say hello" }],
          metadata: { traceId: "trace_1" }
        },
        transport: () =>
          Effect.succeed({
            choices: [{ message: { content: "Hello!" }, finish_reason: "stop" }],
            usage: { promptTokens: 3, completionTokens: 1, totalTokens: 4 }
          })
      })
    );

    expect(result.providerRequest.provider).toBe("openai");
    expect(result.response.text).toBe("Hello!");
    expect(result.response.metadata).toEqual({ traceId: "trace_1" });
  });

  it("provides the adapter service through Effect layers", () => {
    const output = Effect.runSync(
      Effect.gen(function* () {
        const adapterService = yield* AIAdapterService;
        return adapterService;
      }).pipe(Effect.provide(createAIAdapterServiceLayer(registerDefaultAIProviders(createAIAdapterRegistry()))))
    );

    expect(typeof output.complete).toBe("function");
  });

  it("throws a typed error when a provider is missing", () => {
    const registry = createAIAdapterRegistry();

    const result = Effect.runSync(Effect.either(resolveAdapter(registry, "openai")));
    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(AIAdapterProviderNotFoundError);
  });

  it("rejects unsafe unsupported Anthropic message roles instead of remapping them implicitly", () => {
    const anthropic = createAnthropicAdapter();

    const result = Effect.runSync(
      Effect.either(
        anthropic.buildRequest({
          provider: "anthropic",
          model: "claude-3-5-sonnet-latest",
          messages: [
            { role: "system", content: "You are the backend execution adapter." },
            { role: "tool", name: "executor", content: "Run shell command" }
          ]
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(AIAdapterInvalidRequestError);
  });

  it("rejects unsupported Gemini tool roles instead of inventing provider semantics", () => {
    const gemini = createGeminiAdapter();

    const result = Effect.runSync(
      Effect.either(
        gemini.buildRequest({
          provider: "gemini",
          model: "gemini-1.5-pro",
          messages: [
            { role: "system", content: "You are the backend execution adapter." },
            { role: "tool", name: "executor", content: "Run shell command" }
          ]
        })
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(AIAdapterInvalidRequestError);
  });
});
