import { describe, expect, it, vi } from "vitest";
import { createOrchestratorGenerator } from "../../src/generator/orchestrator.js";
import type { VoiceFidelityEvalCase } from "../../src/types.js";

const voiceFidelityCase: VoiceFidelityEvalCase = {
  id: "voice-blog-01",
  suite: "voice-fidelity",
  input: {
    contentType: "blog-post",
    briefing: "Write about monorepos",
    voiceProfile: { type: "fixture", path: "voice-fidelity/profiles/blog-formal.json" },
    qualityMode: "balanced"
  },
  expectations: {},
  tags: ["blog"]
};

describe("orchestrator generator", () => {
  it("runs the orchestrator pipeline and returns generated text", async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount += 1;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: `Generated output part ${callCount}` },
              finish_reason: "stop"
            }
          ]
        })
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const generator = createOrchestratorGenerator({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "test-key"
    });

    const text = await generator.generate(voiceFidelityCase, undefined);

    expect(text).toContain("Generated output part");
    expect(fetchMock).toHaveBeenCalled();
    expect(generator.name).toBe("orchestrator");

    vi.unstubAllGlobals();
  }, 10000);

  it("fails when the LLM provider returns an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized"
    });
    vi.stubGlobal("fetch", fetchMock);

    const generator = createOrchestratorGenerator({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      apiKey: "test-key"
    });

    await expect(generator.generate(voiceFidelityCase, undefined)).rejects.toThrow();

    vi.unstubAllGlobals();
  }, 10000);
});
