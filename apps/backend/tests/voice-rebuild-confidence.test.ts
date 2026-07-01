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

describe("deriveConfidence", () => {
  it("keeps legacy low confidence when fewer than five active examples and no signals", () => {
    const examples = createLegacyHighConfidenceExamples(4);

    expect(deriveConfidence(examples)).toBe("low");
  });

  it("keeps legacy high confidence when five diverse examples exist without signals", () => {
    const examples = createLegacyHighConfidenceExamples(5);

    expect(deriveConfidence(examples)).toBe("high");
  });

  it("uses composite base from example count when signals are present", () => {
    const examples = createLegacyHighConfidenceExamples(3);

    expect(deriveConfidence(examples, createSignals())).toBe("medium");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(2), createSignals())).toBe("low");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(5), createSignals())).toBe("high");
  });

  it("boosts composite confidence for strong consistency and topic independence", () => {
    const examples = createLegacyHighConfidenceExamples(3);
    const signals = createSignals({
      consistencyScore: 0.75,
      topicIndependenceScore: 0.65,
      extractionQuality: {
        reasoningExtracted: true,
        developmentExtracted: true,
        reconciliationNeeded: false
      }
    });

    expect(deriveConfidence(examples, signals)).toBe("high");
  });

  it("downgrades suspiciously generic consistency above 0.95", () => {
    const examples = createLegacyHighConfidenceExamples(5);
    const signals = createSignals({
      consistencyScore: 0.96,
      topicIndependenceScore: 0.9,
      extractionQuality: {
        reasoningExtracted: true,
        developmentExtracted: true,
        reconciliationNeeded: false
      }
    });

    expect(deriveConfidence(examples, signals)).toBe("medium");
    expect(deriveConfidence(createLegacyHighConfidenceExamples(3), signals)).toBe("medium");
  });

  it("respects an optional confidence cap", () => {
    const examples = createLegacyHighConfidenceExamples(5);
    const signals = createSignals({
      consistencyScore: 0.8,
      topicIndependenceScore: 0.7,
      extractionQuality: {
        reasoningExtracted: true,
        developmentExtracted: true,
        reconciliationNeeded: false
      }
    });

    expect(deriveConfidence(examples, signals, "medium")).toBe("medium");
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
