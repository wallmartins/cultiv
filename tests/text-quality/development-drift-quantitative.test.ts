import { describe, expect, it } from "vitest";
import {
  computeAvgSentenceLength,
  computeTypeTokenRatio,
  evaluateArgumentDevelopmentDrift
} from "@my-ai-orchestrator/text-quality";
import type { ArgumentDevelopmentSignature, QuantitativeSignals } from "@my-ai-orchestrator/contracts";

const development: ArgumentDevelopmentSignature = {
  developmentProse: "Builds through observation.",
  epistemicPosture: "exploratory",
  moveLabels: ["observe"],
  structuralAntiPatterns: []
};

function createSignals(overrides: Partial<QuantitativeSignals["aggregate"]> = {}): QuantitativeSignals {
  return {
    aggregate: {
      typeTokenRatio: 0.8,
      avgWordLength: 4.5,
      hapaxRatio: 0.4,
      avgSentenceLength: 20,
      sentenceLengthVariance: 6,
      avgDependencyDepth: 1.8,
      paragraphCount: 3,
      avgParagraphLength: 55,
      punctuationDensity: 0.04,
      formalityScore: 0.8,
      emotionalityScore: 0.2,
      certaintyMarkerCount: 1,
      hedgingMarkerCount: 2,
      transitionMarkerCount: 3,
      ...overrides
    },
    consistencyScore: 0.7,
    topicIndependenceScore: 0.9,
    crossLengthConsistency: 0.88,
    extractionQuality: {
      reasoningExtracted: true,
      developmentExtracted: true,
      reconciliationNeeded: false
    }
  };
}

describe("argument development drift quantitative checks", () => {
  it("penalizes sentence length drift beyond ±25%", () => {
    const shortSentences = "One two three. Four five. Six seven.";
    expect(computeAvgSentenceLength(shortSentences)).toBeLessThan(10);

    const baseline = evaluateArgumentDevelopmentDrift(development, shortSentences, "draft");
    const withSignals = evaluateArgumentDevelopmentDrift(
      development,
      shortSentences,
      "draft",
      createSignals({ avgSentenceLength: 20 })
    );

    expect(withSignals.score).toBeLessThanOrEqual(baseline.score - 15);
    expect(withSignals.notes.some((note) => note.includes("sentence length"))).toBe(true);
  });

  it("penalizes formality drift beyond ±0.2", () => {
    const informal = "Cara, tipo, isso eh show demais pra vc blz massa legal demais.";
    const signals = createSignals({ formalityScore: 0.9 });
    const baseline = evaluateArgumentDevelopmentDrift(development, informal, "draft");
    const withSignals = evaluateArgumentDevelopmentDrift(development, informal, "draft", signals);

    expect(withSignals.score).toBeLessThanOrEqual(baseline.score - 10);
    expect(withSignals.notes.some((note) => note.includes("formality"))).toBe(true);
  });

  it("penalizes vocabulary diversity below 70% of target TTR", () => {
    const repetitive = "word word word word word word word word word word word word.";
    expect(computeTypeTokenRatio(repetitive)).toBeLessThan(0.2);

    const baseline = evaluateArgumentDevelopmentDrift(development, repetitive, "draft");
    const withSignals = evaluateArgumentDevelopmentDrift(
      development,
      repetitive,
      "draft",
      createSignals({ typeTokenRatio: 0.8 })
    );

    expect(withSignals.score).toBeLessThanOrEqual(baseline.score - 10);
    expect(withSignals.notes.some((note) => note.includes("vocabulary diversity"))).toBe(true);
  });

  it("skips quantitative checks when signals are undefined", () => {
    const repetitive = "word word word word word word word word word word word word.";
    const result = evaluateArgumentDevelopmentDrift(development, repetitive, "draft");

    expect(result.notes.some((note) => note.includes("sentence length"))).toBe(false);
    expect(result.notes.some((note) => note.includes("formality"))).toBe(false);
    expect(result.notes.some((note) => note.includes("vocabulary diversity"))).toBe(false);
  });
});
