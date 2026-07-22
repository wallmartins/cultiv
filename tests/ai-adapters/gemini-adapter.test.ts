import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createGeminiAdapter } from "@my-ai-orchestrator/ai-adapters";

describe("gemini adapter", () => {
  it("builds a Gemini request without tools by default", async () => {
    const request = await Effect.runPromise(
      createGeminiAdapter().buildRequest({
        provider: "gemini",
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "hello" }]
      })
    );

    expect(request.provider).toBe("gemini");
    expect(request.body).not.toHaveProperty("tools");
  });

  it("adds the google_search grounding tool when web grounding is requested (FU-2)", async () => {
    const request = await Effect.runPromise(
      createGeminiAdapter().buildRequest({
        provider: "gemini",
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "who are the practitioners of X" }],
        grounding: { webSearch: true }
      })
    );

    expect(request.body).toMatchObject({ tools: [{ google_search: {} }] });
  });

  it("omits the grounding tool when web grounding is explicitly off", async () => {
    const request = await Effect.runPromise(
      createGeminiAdapter().buildRequest({
        provider: "gemini",
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "hello" }],
        grounding: { webSearch: false }
      })
    );

    expect(request.body).not.toHaveProperty("tools");
  });
});
