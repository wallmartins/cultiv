import { describe, expect, it, vi } from "vitest";
import { createJudgeAdapter } from "../../src/scorer/judge-adapter.js";

describe("createJudgeAdapter", () => {
  it("defaults to groq provider and llama-3.3-70b-versatile model", () => {
    const adapter = createJudgeAdapter();

    expect(adapter.provider).toBe("groq");
    expect(adapter.model).toBe("llama-3.3-70b-versatile");
  });

  it("uses explicit provider and model options", () => {
    const adapter = createJudgeAdapter({ provider: "openai", model: "gpt-4o" });

    expect(adapter.provider).toBe("openai");
    expect(adapter.model).toBe("gpt-4o");
  });

  it("calls the LLM and returns parsed score", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { content: JSON.stringify({ score: 84, rationale: "Matches voice." }) },
            finish_reason: "stop"
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = createJudgeAdapter({ provider: "groq", model: "llama-3.3-70b-versatile", apiKey: "test-key" });
    const result = await adapter.complete([
      { role: "system", content: "You are a judge." },
      { role: "user", content: "Candidate text." }
    ]);

    expect(result.text).toContain("84");
    expect(fetchMock).toHaveBeenCalled();
    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(callArgs[1]?.headers).toMatchObject({ authorization: "Bearer test-key" });

    vi.unstubAllGlobals();
  });

  it("throws when api key is missing for providers that require it", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const adapter = createJudgeAdapter({ provider: "openai", model: "gpt-4o" });

    await expect(
      adapter.complete([
        { role: "system", content: "You are a judge." },
        { role: "user", content: "Candidate text." }
      ])
    ).rejects.toThrow("OPENAI_API_KEY");

    vi.unstubAllGlobals();
  });
});
