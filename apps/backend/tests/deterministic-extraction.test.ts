import { describe, expect, it } from "vitest";
import {
  aggregateDeterministicFeatures,
  computeConsistencyScore,
  computeCrossLengthConsistency,
  computeTopicIndependenceScore,
  extractDeterministicFeatures
} from "../src/product/voice/deterministic-extraction.js";

const FORMAL_SAMPLE =
  "Portanto, acredito que a educação formal continua relevante. Contudo, o método tradicional precisa evoluir. " +
  "Certamente, avaliações formativas oferecem feedback mais útil do que provas isoladas.";

const INFORMAL_SAMPLE =
  "Cara, eu acho que trabalho remoto funciona sim, tipo, se você tiver disciplina. " +
  "Talvez nem todo mundo se adapte, mas pra mim é show de bola.";

const REASONING_SAMPLE =
  "Aprendi recentemente que ouvir feedback muda completamente a forma de escrever. " +
  "Antes eu defendia cada frase, mas percebi que revisão não apaga minha voz. " +
  "Provavelmente isso me tornou mais claro e menos defensivo com leitores.";

describe("deterministic extraction", () => {
  it("extracts lexical and punctuation features from short formal text", () => {
    const features = extractDeterministicFeatures(FORMAL_SAMPLE);

    expect(features.typeTokenRatio).toBeGreaterThan(0.5);
    expect(features.avgWordLength).toBeGreaterThan(4);
    expect(features.avgSentenceLength).toBeGreaterThan(5);
    expect(features.punctuationDensity).toBeGreaterThan(0);
    expect(features.formalityScore).toBeGreaterThan(0.2);
    expect(features.certaintyMarkerCount).toBeGreaterThan(0);
    expect(features.transitionMarkerCount).toBeGreaterThan(0);
  });

  it("extracts hedging and informal markers from casual text", () => {
    const features = extractDeterministicFeatures(INFORMAL_SAMPLE);

    expect(features.hedgingMarkerCount).toBeGreaterThan(0);
    expect(features.formalityScore).toBeLessThan(features.emotionalityScore + 1);
    expect(features.avgSentenceLength).toBeGreaterThan(0);
  });

  it("returns zeroed features for empty text", () => {
    expect(extractDeterministicFeatures("   ")).toEqual({
      typeTokenRatio: 0,
      avgWordLength: 0,
      hapaxRatio: 0,
      avgSentenceLength: 0,
      sentenceLengthVariance: 0,
      avgDependencyDepth: 0,
      paragraphCount: 0,
      avgParagraphLength: 0,
      punctuationDensity: 0,
      formalityScore: 0,
      emotionalityScore: 0,
      certaintyMarkerCount: 0,
      hedgingMarkerCount: 0,
      transitionMarkerCount: 0
    });
  });

  it("aggregates features by averaging numeric metrics", () => {
    const first = extractDeterministicFeatures(FORMAL_SAMPLE);
    const second = extractDeterministicFeatures(INFORMAL_SAMPLE);
    const aggregate = aggregateDeterministicFeatures([first, second]);

    expect(aggregate.avgSentenceLength).toBeCloseTo((first.avgSentenceLength + second.avgSentenceLength) / 2, 3);
    expect(aggregate.certaintyMarkerCount).toBeCloseTo(
      (first.certaintyMarkerCount + second.certaintyMarkerCount) / 2,
      3
    );
  });

  it("scores higher consistency for stylistically similar texts", () => {
    const variantA = extractDeterministicFeatures(FORMAL_SAMPLE);
    const variantB = extractDeterministicFeatures(
      "Portanto, avaliações contínuas ajudam alunos. Contudo, provas finais ainda têm valor. Certamente, o ideal é combinar métodos."
    );
    const unrelated = extractDeterministicFeatures(INFORMAL_SAMPLE);

    expect(computeConsistencyScore([variantA, variantB])).toBeGreaterThan(
      computeConsistencyScore([variantA, unrelated])
    );
  });

  it("scores topic independence when style persists across topics", () => {
    const topicA = extractDeterministicFeatures(FORMAL_SAMPLE);
    const topicB = extractDeterministicFeatures(
      "Portanto, ferramentas de IA aceleram tarefas repetitivas. Contudo, revisão humana continua essencial. Certamente, o ganho vem da combinação."
    );
    const differentStyle = extractDeterministicFeatures(INFORMAL_SAMPLE);

    expect(
      computeTopicIndependenceScore([topicA, topicB], ["education", "technology"])
    ).toBeGreaterThan(
      computeTopicIndependenceScore([topicA, differentStyle], ["education", "technology"])
    );
  });

  it("scores cross-length consistency when cadence stays stable across buckets", () => {
    const shortFormal = extractDeterministicFeatures(FORMAL_SAMPLE);
    const longFormal = extractDeterministicFeatures(
      `${FORMAL_SAMPLE} ${FORMAL_SAMPLE} Portanto, consistência importa em textos longos e curtos.`
    );
    const casualLong = extractDeterministicFeatures(`${INFORMAL_SAMPLE} ${INFORMAL_SAMPLE}`);

    expect(
      computeCrossLengthConsistency([
        { ...shortFormal, textLengthBucket: "short" },
        { ...longFormal, textLengthBucket: "long" }
      ])
    ).toBeGreaterThan(
      computeCrossLengthConsistency([
        { ...shortFormal, textLengthBucket: "short" },
        { ...casualLong, textLengthBucket: "long" }
      ])
    );
  });

  it("extracts reasoning sample within performance budget", () => {
    const started = performance.now();
    extractDeterministicFeatures(REASONING_SAMPLE);
    expect(performance.now() - started).toBeLessThan(50);
  });
});
