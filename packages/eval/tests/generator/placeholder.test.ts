import { describe, expect, it } from "vitest";
import { createPlaceholderGenerator } from "../../src/generator/placeholder.js";
import type { VoiceFidelityEvalCase } from "../../src/types.js";

const baseVoiceProfile = {
  tone: "neutral",
  cadence: "natural",
  description: "Test voice",
  coreReasoningSignature: {
    narrativeProse: "Observational and moderate.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow"
  }
} as const;

const voiceFidelityCase: VoiceFidelityEvalCase = {
  id: "voice-blog-01",
  suite: "voice-fidelity",
  input: {
    contentType: "blog-post",
    briefing: "Write about monorepos",
    voiceProfile: baseVoiceProfile,
    qualityMode: "balanced"
  },
  expectations: {},
  tags: ["blog"]
};

describe("placeholder generator", () => {
  it("returns a placeholder text for voice-fidelity cases", async () => {
    const generator = createPlaceholderGenerator();
    const text = await generator.generate(voiceFidelityCase, baseVoiceProfile as never);

    expect(text).toContain("monorepos");
    expect(text).toContain("moderate");
    expect(generator.name).toBe("placeholder");
  });

  it("returns empty text for non-voice-fidelity cases", async () => {
    const generator = createPlaceholderGenerator();
    const driftCase = {
      id: "drift-01",
      suite: "drift-regression",
      input: {
        voiceProfile: baseVoiceProfile,
        candidate: "candidate text"
      },
      expectations: {},
      tags: []
    } as const;

    const text = await generator.generate(driftCase as never, baseVoiceProfile as never);
    expect(text).toBe("");
  });
});
