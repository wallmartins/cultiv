import { describe, expect, it } from "vitest";
import { createOrchestratorGenerator } from "../../src/generator/orchestrator.js";
import type { VoiceFidelityEvalCase } from "../../src/types.js";

const hasApiKey = Boolean(process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY);

describe.skipIf(!hasApiKey)("orchestrator generator integration", () => {
  it("generates non-empty text aligned to a voice profile", async () => {
    const evalCase: VoiceFidelityEvalCase = {
      id: "integration-voice-blog-01",
      suite: "voice-fidelity",
      input: {
        contentType: "blog-post",
        briefing: "Write about the hidden costs of microservices",
        voiceProfile: { type: "fixture", path: "voice-fidelity/profiles/formal-architect.json" },
        qualityMode: "balanced"
      },
      expectations: {},
      tags: ["integration", "blog"]
    };

    const generator = createOrchestratorGenerator();
    const text = await generator.generate(evalCase, undefined);

    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(200);
    expect(text.toLowerCase()).toMatch(/microservice|service|cost|constraint|tradeoff/);
  }, 120000);
});
