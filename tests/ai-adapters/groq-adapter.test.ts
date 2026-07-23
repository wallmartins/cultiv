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

  it("ignores the web-grounding request without erroring or emitting tools (FU-2 fallback)", async () => {
    const adapter = createGroqAdapter();

    const request = await Effect.runPromise(
      adapter.buildRequest({
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hello" }],
        grounding: { webSearch: true }
      })
    );

    // Groq has no grounding surface — the Gemini->Groq fallback must degrade to an ungrounded request,
    // never forward the field or choke on it.
    expect(request.body).not.toHaveProperty("tools");
    expect(request.body).not.toHaveProperty("grounding");
  });
});
