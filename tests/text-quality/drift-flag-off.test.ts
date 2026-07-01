import { describe, expect, it } from "vitest";
import { evaluateVoiceDrift } from "@my-ai-orchestrator/text-quality";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";

const baseProfile: VoiceProfile = {
  userId: "user-1",
  tone: "informal",
  cadence: "direct",
  lexicon: [],
  constraints: [],
  antiPatterns: ["generic linkedin tone"],
  antiPatternsExplicit: [],
  rules: [],
  styleMarkers: ["first-person"],
  userLabels: []
};

describe("voice drift without reasoning signature", () => {
  it("matches legacy surface-only scoring when core signature is absent", () => {
    const candidate = "Texto sem absolutismos, com tom pessoal e parágrafos curtos.";
    const withoutCore = evaluateVoiceDrift(baseProfile, candidate);
    const withEmptyCore = evaluateVoiceDrift(
      { ...baseProfile, coreReasoningSignature: undefined },
      candidate
    );

    expect(withoutCore.score).toBe(withEmptyCore.score);
    expect(withoutCore.notes).toEqual(withEmptyCore.notes);
  });

  it("applies reasoning blend only when core signature is present", () => {
    const candidate = "Obviamente todo mundo sempre deveria fazer assim sem exceção.";
    const surfaceOnly = evaluateVoiceDrift(baseProfile, candidate);
    const withCore = evaluateVoiceDrift(
      {
        ...baseProfile,
        coreReasoningSignature: {
          narrativeProse: "Observes before concluding.",
          certaintyLevel: "moderate",
          judgmentFrequency: "low",
          conclusionPace: "slow",
          readerRelationship: "peer",
          authoritySource: "personal_observation",
          derivedAntiPatterns: []
        }
      },
      candidate,
      undefined,
      "draft"
    );

    expect(withCore.score).toBeLessThan(surfaceOnly.score);
  });
});
