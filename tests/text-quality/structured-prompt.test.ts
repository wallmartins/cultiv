import { describe, expect, it } from "vitest";
import { buildStructuredPrompt, createVoiceProfile } from "@my-ai-orchestrator/text-quality";
import type { QuantitativeSignals } from "@my-ai-orchestrator/contracts";

function createSignals(overrides: Partial<QuantitativeSignals["aggregate"]> = {}): QuantitativeSignals {
  return {
    aggregate: {
      typeTokenRatio: 0.72,
      avgWordLength: 4.5,
      hapaxRatio: 0.4,
      avgSentenceLength: 18,
      sentenceLengthVariance: 6,
      avgDependencyDepth: 1.8,
      paragraphCount: 3,
      avgParagraphLength: 55,
      punctuationDensity: 0.04,
      formalityScore: 0.62,
      emotionalityScore: 0.2,
      certaintyMarkerCount: 1,
      hedgingMarkerCount: 2,
      transitionMarkerCount: 3,
      ...overrides
    },
    consistencyScore: 0.85,
    topicIndependenceScore: 0.9,
    crossLengthConsistency: 0.88,
    extractionQuality: {
      reasoningExtracted: true,
      developmentExtracted: true,
      reconciliationNeeded: false
    }
  };
}

describe("buildStructuredPrompt", () => {
  it("includes all 7 sections when quantitative signals are present", () => {
    const profile = createVoiceProfile("user-1", {
      tone: "informal",
      cadence: "direct",
      styleMarkers: ["first-person"],
      rules: ["Keep paragraphs short"],
      antiPatterns: ["corporate jargon"],
      derivedAntiPatterns: ["rhetorical inflation"],
      signatureOpenings: ["I noticed something"],
      signatureClosings: ["That is the point"],
      quantitativeSignals: createSignals(),
      coreReasoningSignature: {
        narrativeProse: "Observes before concluding.",
        certaintyLevel: "moderate",
        judgmentFrequency: "low",
        conclusionPace: "slow",
        readerRelationship: "peer",
        authoritySource: "personal_observation",
        derivedAntiPatterns: []
      },
      argumentDevelopmentSignature: {
        developmentProse: "Builds through lived examples.",
        epistemicPosture: "exploratory",
        moveLabels: ["observe"],
        structuralAntiPatterns: []
      }
    });

    const { system } = buildStructuredPrompt(profile);

    expect(system).toContain("== AUTHOR VOICE ==");
    expect(system).toContain("== HOW THEY DEVELOP TEXTS ==");
    expect(system).toContain("== SIGNATURE PHRASES ==");
    expect(system).toContain("== WRITING STYLE ==");
    expect(system).toContain("== QUANTITATIVE CONSTRAINTS ==");
    expect(system).toContain("== ANTI-PATTERNS ==");
    expect(system).toContain("== STRUCTURAL RULES ==");
    expect(system).toContain("Average sentence length: 18 words");
    expect(system).not.toContain("Examples:");
  });

  it("uses varies fallback when quantitative signals are absent", () => {
    const profile = createVoiceProfile("user-1", {
      tone: "formal",
      cadence: "measured"
    });

    const { system } = buildStructuredPrompt(profile);

    expect(system).toContain("Average sentence length: varies words");
    expect(system).toContain("Vocabulary diversity: varies");
    expect(system).toContain("Openings: none");
    expect(system).toContain("Closings: none");
  });
});
