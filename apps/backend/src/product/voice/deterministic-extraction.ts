import type { QuantitativeSignals } from "@my-ai-orchestrator/contracts";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { resolveWizardTopicTag } from "./wizard-voice-examples.js";

export interface DeterministicFeatures {
  readonly typeTokenRatio: number;
  readonly avgWordLength: number;
  readonly hapaxRatio: number;
  readonly avgSentenceLength: number;
  readonly sentenceLengthVariance: number;
  readonly avgDependencyDepth: number;
  readonly paragraphCount: number;
  readonly avgParagraphLength: number;
  readonly punctuationDensity: number;
  readonly formalityScore: number;
  readonly emotionalityScore: number;
  readonly certaintyMarkerCount: number;
  readonly hedgingMarkerCount: number;
  readonly transitionMarkerCount: number;
}

const CERTAINTY_MARKERS =
  /\b(certainly|certamente|sempre|always|never|nunca|definitely|com certeza|without doubt|indubitavelmente)\b/gi;
const HEDGING_MARKERS =
  /\b(talvez|maybe|perhaps|provavelmente|probably|acho que|i think|i guess|parece que|might|could be|pode ser)\b/gi;
const TRANSITION_MARKERS =
  /\b(portanto|therefore|however|contudo|por outro lado|on the other hand|alem disso|furthermore|in addition|por fim|finally|em resumo|in summary|consequently|assim|thus)\b/gi;
const FORMAL_MARKERS =
  /\b(portanto|contudo|todavia|entretanto|outrossim|destarte|mediante|consoante|outorga|notoriamente)\b/gi;
const INFORMAL_MARKERS = /\b(cara|tipo|ne|pra|ta|vc|vcs|blz|show|massa|legal demais)\b/gi;
const EMOTION_MARKERS =
  /\b(amor|odio|incriv|maravilh|terrivel|horrivel|passion|excit|frustrat|angry|feliz|triste|awesome|amazing)\b/gi;

const NUMERIC_KEYS: readonly (keyof DeterministicFeatures)[] = [
  "typeTokenRatio",
  "avgWordLength",
  "hapaxRatio",
  "avgSentenceLength",
  "sentenceLengthVariance",
  "avgDependencyDepth",
  "paragraphCount",
  "avgParagraphLength",
  "punctuationDensity",
  "formalityScore",
  "emotionalityScore",
  "certaintyMarkerCount",
  "hedgingMarkerCount",
  "transitionMarkerCount"
];

const CONSISTENCY_KEYS: readonly (keyof DeterministicFeatures)[] = [
  "typeTokenRatio",
  "avgWordLength",
  "avgSentenceLength",
  "formalityScore",
  "punctuationDensity",
  "emotionalityScore"
];

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text: string): readonly string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function splitSentences(text: string): readonly string[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  return sentences.length > 0 ? sentences : [text.trim()].filter(Boolean);
}

function splitParagraphs(text: string): readonly string[] {
  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
  return paragraphs.length > 0 ? paragraphs : [text.trim()].filter(Boolean);
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches?.length ?? 0;
}

function variance(values: readonly number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
}

function normalizedVarianceAcross(values: readonly number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  if (mean === 0) {
    return variance(values) === 0 ? 0 : 1;
  }

  const coefficientOfVariation = Math.sqrt(variance(values)) / Math.abs(mean);
  return Math.min(1, coefficientOfVariation);
}

function averageMetric(
  features: readonly DeterministicFeatures[],
  key: keyof DeterministicFeatures
): number {
  if (features.length === 0) {
    return 0;
  }

  return features.reduce((total, feature) => total + feature[key], 0) / features.length;
}

function estimateDependencyDepth(sentence: string): number {
  const commas = (sentence.match(/,/g) ?? []).length;
  const subordinateMarkers = countMatches(
    sentence,
    /\b(porque|because|although|embora|while|quando|if|se|that|que|which|qual)\b/gi
  );
  return 1 + commas * 0.5 + subordinateMarkers * 0.75;
}

export function extractDeterministicFeatures(text: string): DeterministicFeatures {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return {
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
    };
  }

  const words = tokenize(trimmed);
  const sentences = splitSentences(trimmed);
  const paragraphs = splitParagraphs(trimmed);
  const uniqueWords = new Set(words);
  const frequencies = new Map<string, number>();

  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  const hapaxCount = [...frequencies.values()].filter((count) => count === 1).length;
  const sentenceLengths = sentences.map((sentence) => tokenize(sentence).length);
  const avgSentenceLength =
    sentenceLengths.reduce((total, length) => total + length, 0) / Math.max(1, sentenceLengths.length);
  const punctuationCount = (trimmed.match(/[,.!?;:—\-()[\]""'']/g) ?? []).length;
  const formalCount = countMatches(trimmed, FORMAL_MARKERS);
  const informalCount = countMatches(trimmed, INFORMAL_MARKERS);
  const emotionCount = countMatches(trimmed, EMOTION_MARKERS);
  const exclamationCount = (trimmed.match(/!/g) ?? []).length;
  const formalityDenominator = Math.max(1, formalCount + informalCount);
  const emotionalityDenominator = Math.max(1, words.length / 10 + exclamationCount);

  return {
    typeTokenRatio: round(uniqueWords.size / Math.max(1, words.length)),
    avgWordLength: round(words.reduce((total, word) => total + word.length, 0) / Math.max(1, words.length)),
    hapaxRatio: round(hapaxCount / Math.max(1, uniqueWords.size)),
    avgSentenceLength: round(avgSentenceLength),
    sentenceLengthVariance: round(variance(sentenceLengths)),
    avgDependencyDepth: round(
      sentences.reduce((total, sentence) => total + estimateDependencyDepth(sentence), 0) /
        Math.max(1, sentences.length)
    ),
    paragraphCount: paragraphs.length,
    avgParagraphLength: round(
      paragraphs.reduce((total, paragraph) => total + tokenize(paragraph).length, 0) /
        Math.max(1, paragraphs.length)
    ),
    punctuationDensity: round(punctuationCount / Math.max(1, trimmed.length)),
    formalityScore: round(formalCount / formalityDenominator),
    emotionalityScore: round((emotionCount + exclamationCount) / emotionalityDenominator),
    certaintyMarkerCount: countMatches(trimmed, CERTAINTY_MARKERS),
    hedgingMarkerCount: countMatches(trimmed, HEDGING_MARKERS),
    transitionMarkerCount: countMatches(trimmed, TRANSITION_MARKERS)
  };
}

export function aggregateDeterministicFeatures(
  features: readonly DeterministicFeatures[]
): DeterministicFeatures {
  if (features.length === 0) {
    return extractDeterministicFeatures("");
  }

  const aggregate = {} as Record<keyof DeterministicFeatures, number>;
  for (const key of NUMERIC_KEYS) {
    aggregate[key] = round(averageMetric(features, key));
  }

  return aggregate;
}

export function computeConsistencyScore(features: readonly DeterministicFeatures[]): number {
  if (features.length <= 1) {
    return 1;
  }

  const normalizedVariances = CONSISTENCY_KEYS.map((key) =>
    normalizedVarianceAcross(features.map((feature) => feature[key]))
  );
  const averageVariance =
    normalizedVariances.reduce((total, value) => total + value, 0) / normalizedVariances.length;

  return round(Math.max(0, Math.min(1, 1 - averageVariance)));
}

export function computeTopicIndependenceScore(
  features: readonly DeterministicFeatures[],
  topicTags: readonly string[]
): number {
  if (features.length <= 1 || topicTags.length !== features.length) {
    return features.length <= 1 ? 1 : 0;
  }

  const groups = new Map<string, DeterministicFeatures[]>();
  for (let index = 0; index < features.length; index += 1) {
    const tag = topicTags[index] ?? "unknown";
    const bucket = groups.get(tag) ?? [];
    bucket.push(features[index]!);
    groups.set(tag, bucket);
  }

  if (groups.size <= 1) {
    return 1;
  }

  const aggregates = [...groups.values()].map((group) => aggregateDeterministicFeatures(group));
  const normalizedVariances = CONSISTENCY_KEYS.map((key) =>
    normalizedVarianceAcross(aggregates.map((aggregate) => aggregate[key]))
  );
  const averageVariance =
    normalizedVariances.reduce((total, value) => total + value, 0) / normalizedVariances.length;

  return round(Math.max(0, Math.min(1, 1 - averageVariance)));
}

export function computeCrossLengthConsistency(
  features: readonly (DeterministicFeatures & { textLengthBucket?: string })[]
): number {
  if (features.length <= 1) {
    return 1;
  }

  const groups = new Map<string, DeterministicFeatures[]>();
  for (const feature of features) {
    const bucket = feature.textLengthBucket ?? "unknown";
    const existing = groups.get(bucket) ?? [];
    existing.push(feature);
    groups.set(bucket, existing);
  }

  if (groups.size <= 1) {
    return 1;
  }

  const aggregates = [...groups.values()].map((group) => aggregateDeterministicFeatures(group));
  const normalizedVariances = CONSISTENCY_KEYS.map((key) =>
    normalizedVarianceAcross(aggregates.map((aggregate) => aggregate[key]))
  );
  const averageVariance =
    normalizedVariances.reduce((total, value) => total + value, 0) / normalizedVariances.length;

  return round(Math.max(0, Math.min(1, 1 - averageVariance)));
}

export function buildQuantitativeSignalsFromWizardExamples(
  wizardExamples: readonly VoiceExampleRecord[],
  extractionQuality: QuantitativeSignals["extractionQuality"]
): QuantitativeSignals {
  const features = wizardExamples.map((example) => {
    const base = example.deterministicFeatures ?? extractDeterministicFeatures(example.text);
    return example.textLengthBucket
      ? { ...base, textLengthBucket: example.textLengthBucket }
      : base;
  });
  const topicTags = wizardExamples.map((example) => resolveWizardTopicTag(example));

  return {
    aggregate: aggregateDeterministicFeatures(features),
    consistencyScore: computeConsistencyScore(features),
    topicIndependenceScore: computeTopicIndependenceScore(features, topicTags),
    crossLengthConsistency: computeCrossLengthConsistency(features),
    extractionQuality
  };
}
