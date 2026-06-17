import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createGroqAdapter } from "@my-ai-orchestrator/ai-adapters";

describe("groq adapter", () => {
  it("builds an OpenAI-compatible request payload", async () => {
    const adapter = createGroqAdapter();

    const request = await Effect.runPromise(
      adapter.buildRequest({
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hello" }],
        temperature: 0.2
      })
    );

    expect(request.provider).toBe("groq");
    expect(request.body).toMatchObject({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "hello" }]
    });
  });
});
