import { describe, expect, it } from "vitest";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import { scoreWithJudge, type JudgeAdapter } from "../../src/scorer/judge.js";

const voiceProfile: TextQualityVoiceProfile = {
  userId: "test-user",
  tone: "measured",
  cadence: "moderate",
  lexicon: [],
  constraints: [],
  antiPatterns: [],
  antiPatternsExplicit: [],
  rules: [],
  styleMarkers: [],
  userLabels: [],
  coreReasoningSignature: {
    narrativeProse: "Builds arguments through explicit tradeoffs and measured recommendations.",
    certaintyLevel: "moderate",
    judgmentFrequency: "moderate",
    conclusionPace: "moderate",
    readerRelationship: "peer",
    authoritySource: "practice",
    derivedAntiPatterns: []
  }
};

describe("scoreWithJudge", () => {
  it("returns null when the profile has no core reasoning signature", async () => {
    const profile: TextQualityVoiceProfile = { ...voiceProfile, coreReasoningSignature: undefined };
    const adapter: JudgeAdapter = {
      provider: "test",
      model: "test-model",
      complete: async () => ({ text: '{"score": 80, "rationale": "ok"}' })
    };

    const result = await scoreWithJudge("sample", profile, adapter);

    expect(result).toBeNull();
  });

  it("returns a JudgeScore when the adapter returns valid JSON", async () => {
    const adapter: JudgeAdapter = {
      provider: "test",
      model: "test-model",
      complete: async () => ({ text: '{"score": 82, "rationale": "Matches the measured tone."}' })
    };

    const result = await scoreWithJudge("sample", voiceProfile, adapter);

    expect(result).not.toBeNull();
    expect(result?.score).toBe(82);
    expect(result?.rationale).toBe("Matches the measured tone.");
    expect(result?.provider).toBe("test");
    expect(result?.model).toBe("test-model");
  });

  it("gracefully returns null when the adapter fails", async () => {
    const adapter: JudgeAdapter = {
      provider: "test",
      model: "test-model",
      complete: async () => {
        throw new Error("adapter failure");
      }
    };

    const result = await scoreWithJudge("sample", voiceProfile, adapter);

    expect(result).toBeNull();
  });

  it("gracefully returns null when the response is not valid JSON", async () => {
    const adapter: JudgeAdapter = {
      provider: "test",
      model: "test-model",
      complete: async () => ({ text: "not json" })
    };

    const result = await scoreWithJudge("sample", voiceProfile, adapter);

    expect(result).toBeNull();
  });

  it("clamps scores to the 0–100 range", async () => {
    const adapter: JudgeAdapter = {
      provider: "test",
      model: "test-model",
      complete: async () => ({ text: '{"score": 150, "rationale": "over"}' })
    };

    const result = await scoreWithJudge("sample", voiceProfile, adapter);

    expect(result?.score).toBe(100);
  });
});
