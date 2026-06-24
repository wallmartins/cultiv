import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  createDeepSeekAdapter,
  createGroqAdapter,
  createOpenAIAdapter
} from "@my-ai-orchestrator/ai-adapters";

const openAiCompatibleProviders = [
  { create: createGroqAdapter, name: "groq" as const, model: "llama-3.3-70b-versatile" },
  { create: createOpenAIAdapter, name: "openai" as const, model: "gpt-4o-mini" },
  { create: createDeepSeekAdapter, name: "deepseek" as const, model: "deepseek-chat" }
] as const;

describe.each(openAiCompatibleProviders)("$name adapter", ({ create, name, model }) => {
  it("builds an OpenAI-compatible request payload", async () => {
    const adapter = create();

    const request = await Effect.runPromise(
      adapter.buildRequest({
        provider: name,
        model,
        messages: [{ role: "user", content: "hello" }],
        temperature: 0.2
      })
    );

    expect(request.provider).toBe(name);
    expect(request.body).toMatchObject({
      model,
      messages: [{ role: "user", content: "hello" }],
      temperature: 0.2
    });
  });
});
