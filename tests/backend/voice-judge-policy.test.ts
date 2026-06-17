import { describe, expect, it } from "vitest";
import { shouldInvokeVoiceJudge } from "../../apps/backend/src/execution/quality/voice-judge-policy.js";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";

const voiceProfile: VoiceProfile = {
  userId: "user-1",
  tone: "informal",
  cadence: "direct",
  lexicon: [],
  constraints: [],
  examples: ["Example one", "Example two"],
  antiPatterns: [],
  antiPatternsExplicit: [],
  rules: [],
  styleMarkers: [],
  userLabels: [],
  coreReasoningSignature: {
    narrativeProse: "Observes before concluding.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: []
  }
};

function candidate(laneId: string, driftScore: number, finalScore: number): CandidateText {
  return {
    laneId,
    draft: "draft",
    humanizedDraft: "humanized",
    refinedDraft: "refined",
    critic: { findings: [], score: 80 },
    fidelity: { passed: true, score: 80, notes: [] },
    drift: { score: driftScore, notes: [] },
    score: {
      criticScore: 80,
      fidelityScore: 80,
      driftScore: driftScore,
      strategyBonus: 0,
      finalScore
    }
  };
}

describe("voice judge policy", () => {
  it("never invokes judge in fast mode", () => {
    expect(
      shouldInvokeVoiceJudge({
        qualityMode: "fast",
        reasoningSignatureEnabled: true,
        voiceProfile,
        candidates: [candidate("a", 70, 80)]
      })
    ).toBe(false);
  });

  it("always invokes judge in strict mode when reasoning is enabled", () => {
    expect(
      shouldInvokeVoiceJudge({
        qualityMode: "strict",
        reasoningSignatureEnabled: true,
        voiceProfile,
        candidates: [candidate("a", 90, 90)]
      })
    ).toBe(true);
  });

  it("skips judge when reasoning flag is off", () => {
    expect(
      shouldInvokeVoiceJudge({
        qualityMode: "strict",
        reasoningSignatureEnabled: false,
        voiceProfile,
        candidates: [candidate("a", 70, 80)]
      })
    ).toBe(false);
  });

  it("invokes judge on borderline drift in balanced mode", () => {
    expect(
      shouldInvokeVoiceJudge({
        qualityMode: "balanced",
        reasoningSignatureEnabled: true,
        voiceProfile,
        candidates: [candidate("a", 70, 82)]
      })
    ).toBe(true);
  });

  it("invokes judge on top-two tie in balanced mode", () => {
    expect(
      shouldInvokeVoiceJudge({
        qualityMode: "balanced",
        reasoningSignatureEnabled: true,
        voiceProfile,
        candidates: [candidate("a", 90, 81), candidate("b", 88, 80)]
      })
    ).toBe(true);
  });

  it("skips judge when drift is clearly good in balanced mode", () => {
    expect(
      shouldInvokeVoiceJudge({
        qualityMode: "balanced",
        reasoningSignatureEnabled: true,
        voiceProfile,
        candidates: [candidate("a", 92, 90), candidate("b", 50, 70)]
      })
    ).toBe(false);
  });
});
