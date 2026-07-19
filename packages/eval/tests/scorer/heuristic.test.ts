import { describe, expect, it } from "vitest";
import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import { scoreHeuristic } from "../../src/scorer/heuristic.js";

const minimalVoiceProfile: TextQualityVoiceProfile = {
  userId: "test-user",
  tone: "measured",
  cadence: "moderate",
  lexicon: [],
  constraints: [],
  antiPatterns: [],
  antiPatternsExplicit: [],
  rules: [],
  styleMarkers: [],
  userLabels: []
};

const reasoningVoiceProfile: TextQualityVoiceProfile = {
  ...minimalVoiceProfile,
  coreReasoningSignature: {
    narrativeProse: "Builds arguments through explicit tradeoffs and measured recommendations.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "moderate",
    readerRelationship: "peer",
    authoritySource: "practice",
    derivedAntiPatterns: ["hand-wavy wording"]
  }
};

describe("scoreHeuristic", () => {
  it("returns a heuristic score with all sub-scores", () => {
    const result = scoreHeuristic("A clean, direct sentence.", minimalVoiceProfile);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.subScores.critic).toBeGreaterThanOrEqual(0);
    expect(result.subScores.fidelity).toBeGreaterThanOrEqual(0);
    expect(result.subScores.drift).toBeGreaterThanOrEqual(0);
    expect(result.subScores.lexical).toBeGreaterThanOrEqual(0);
  });

  it("penalizes a candidate that triggers the critic", () => {
    const badText = "Como uma IA, não posso escrever isso. Segue o texto refinado.";

    const result = scoreHeuristic(badText, minimalVoiceProfile);

    expect(result.subScores.critic).toBeLessThan(80);
  });

  it("detects reasoning drift against the profile", () => {
    const badText = "Obviamente você deve sempre fazer assim sem exceção.";

    const result = scoreHeuristic(badText, reasoningVoiceProfile);

    expect(result.subScores.drift).toBeLessThan(80);
  });

  it("uses development drift when argument development signature is present", () => {
    const profile: TextQualityVoiceProfile = {
      ...reasoningVoiceProfile,
      argumentDevelopmentSignature: {
        developmentProse: "Frames decisions through explicit tradeoffs.",
        moveLabels: ["constraint", "tradeoff", "recommendation"],
        transitionTendencies: [],
        epistemicPosture: "investigative",
        structuralAntiPatterns: ["absolute_prescription"]
      }
    };

    const badText = "Você deve adotar esta solução imediatamente, sem tradeoffs.";
    const result = scoreHeuristic(badText, profile);

    expect(result.subScores.developmentDrift).toBeLessThan(80);
  });

  it("computes fidelity when a reference is provided", () => {
    const reference = "monorepo AI projects scale";
    const candidate = "Monorepos help AI projects scale effectively.";

    const result = scoreHeuristic(candidate, minimalVoiceProfile, { reference });

    expect(result.subScores.fidelity).toBeGreaterThan(50);
  });

  it("returns a default fidelity score when no reference is provided", () => {
    const result = scoreHeuristic("Any candidate text.", minimalVoiceProfile);

    expect(result.subScores.fidelity).toBe(100);
  });
});
