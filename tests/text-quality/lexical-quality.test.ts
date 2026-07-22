import { describe, expect, it } from "vitest";
import { evaluateLexicalQuality } from "../../packages/text-quality/src/quality/lexical-quality.js";

describe("evaluateLexicalQuality", () => {
  it("penalizes repeated bigrams regardless of topic", () => {
    const evaluation = evaluateLexicalQuality(
      "Aprendi mais ouvindo pessoas do que lendo decks. Ouvindo pessoas eu aprendo. Ouvindo pessoas eu cresço. Ouvindo pessoas eu mudo."
    );

    expect(evaluation.metrics.repeatedBigramCount).toBeGreaterThan(0);
    expect(evaluation.penalty).toBeGreaterThan(0);
  });

  it("does not flag bigram or lemma repetition on non-repetitive text", () => {
    const evaluation = evaluateLexicalQuality(
      "Escolhemos cache distribuído porque o endpoint crítico não aguentava pressão de leitura."
    );

    expect(evaluation.metrics.repeatedBigramCount).toBe(0);
    expect(evaluation.metrics.spacedLemmaRepeats).toBe(0);
  });
});
