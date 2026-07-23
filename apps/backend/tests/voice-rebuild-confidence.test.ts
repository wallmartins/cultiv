import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type { QuantitativeSignals } from "@my-ai-orchestrator/contracts";
import { deriveConfidence } from "../src/product/voice/voice-rebuild-derivation.js";
import { extractSignaturePhrases } from "../src/product/voice/reasoning-extraction.js";
import { extractDeterministicFeatures } from "../src/product/voice/deterministic-extraction.js";

function createExample(overrides: Partial<VoiceExampleRecord> = {}): VoiceExampleRecord {
  return {
    state: "active",
    language: "pt-BR",
    text: "Exemplo com texto suficiente para passar nos filtros de voz.",
    explicitContentType: "blog",
    channel: "newsletter",
    format: "essay",
    effectiveContentTypeHints: [],
    antiPatternsExplicit: [],
    classificationLabels: [],
    pinned: false,
    ...overrides
  } as VoiceExampleRecord;
}

function createLegacyHighConfidenceExamples(count: number): VoiceExampleRecord[] {
  return Array.from({ length: count }, (_, index) =>
    createExample({
      text: `Exemplo ${index + 1} com variedade de canal e formato para cobrir diversidade de voz e contexto editorial.`,
      explicitContentType: index % 2 === 0 ? "blog" : "social",
      channel: index % 2 === 0 ? "newsletter" : "linkedin",
      format: index % 2 === 0 ? "essay" : "thread"
    })
  );
}

function createSignals(overrides: Partial<QuantitativeSignals> = {}): QuantitativeSignals {
  return {
    aggregate: extractDeterministicFeatures("Texto de referência para agregação determinística."),
    consistencyScore: 0.5,
    topicIndependenceScore: 0.5,
    crossLengthConsistency: 0.5,
    extractionQuality: {
      reasoningExtracted: false,
      developmentExtracted: false,
      reconciliationNeeded: false
    },
    ...overrides
  };
}

const COMPLETE_EXTRACTION = {
  reasoningExtracted: true,
  developmentExtracted: true,
  reconciliationNeeded: false
} as const;

describe("deriveConfidence", () => {
  it("keeps legacy low confidence below a complete calibration and no signals", () => {
    expect(deriveConfidence(createLegacyHighConfidenceExamples(3))).toBe("low");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(4))).toBe("high");
  });

  it("never penalises a voice for being consistent", () => {
    // The whole point of a Voice Profile: an author who writes the same way every time has a
    // style, not a defect. This used to be downgraded as "suspiciously generic".
    const signals = createSignals({
      consistencyScore: 0.99,
      topicIndependenceScore: 0.99,
      extractionQuality: COMPLETE_EXTRACTION
    });

    expect(deriveConfidence(createLegacyHighConfidenceExamples(4), signals)).toBe("high");
  });

  it("bands confidence by how defined the style is", () => {
    const examples = createLegacyHighConfidenceExamples(4);
    const withStyle = (score: number) =>
      createSignals({
        consistencyScore: score,
        topicIndependenceScore: score,
        extractionQuality: COMPLETE_EXTRACTION
      });

    expect(deriveConfidence(examples, withStyle(0.9))).toBe("high");
    expect(deriveConfidence(examples, withStyle(0.75))).toBe("medium");
    expect(deriveConfidence(examples, withStyle(0.5))).toBe("low");
  });

  it("lets the weaker of consistency and topic independence govern", () => {
    // A form that only holds inside one subject is not yet a voice.
    const signals = createSignals({
      consistencyScore: 0.99,
      topicIndependenceScore: 0.5,
      extractionQuality: COMPLETE_EXTRACTION
    });

    expect(deriveConfidence(createLegacyHighConfidenceExamples(4), signals)).toBe("low");
  });

  it("caps confidence at medium when half the profile is missing", () => {
    const signals = createSignals({
      consistencyScore: 0.95,
      topicIndependenceScore: 0.95,
      extractionQuality: { ...COMPLETE_EXTRACTION, developmentExtracted: false }
    });

    expect(deriveConfidence(createLegacyHighConfidenceExamples(4), signals)).toBe("medium");
  });

  it("caps confidence by how much material the author actually gave", () => {
    const signals = createSignals({
      consistencyScore: 0.95,
      topicIndependenceScore: 0.95,
      extractionQuality: COMPLETE_EXTRACTION
    });

    expect(deriveConfidence(createLegacyHighConfidenceExamples(4), signals)).toBe("high");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(3), signals)).toBe("medium");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(1), signals)).toBe("low");
  });

  it("respects an optional confidence cap", () => {
    const signals = createSignals({
      consistencyScore: 0.95,
      topicIndependenceScore: 0.95,
      extractionQuality: COMPLETE_EXTRACTION
    });

    expect(deriveConfidence(createLegacyHighConfidenceExamples(4), signals, "medium")).toBe("medium");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(4), undefined, "medium")).toBe("medium");
  });
});

describe("extractSignaturePhrases", () => {
  it("dedupes first and last sentences up to five each", () => {
    const phrases = extractSignaturePhrases([
      "Primeira frase de abertura. Segunda frase. Fechamento comum.",
      "Primeira frase de abertura. Outro meio. Fechamento comum.",
      "Outra abertura distinta. Meio. Outro fechamento."
    ]);

    expect(phrases.signatureOpenings).toEqual([
      "Primeira frase de abertura",
      "Outra abertura distinta"
    ]);
    expect(phrases.signatureClosings).toEqual(["Fechamento comum", "Outro fechamento"]);
  });
});
