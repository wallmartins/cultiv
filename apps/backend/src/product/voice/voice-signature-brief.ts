import type {
  CertaintyLevel,
  ConclusionPace,
  JudgmentFrequency,
  ReaderRelationship,
  AuthoritySource
} from "@my-ai-orchestrator/contracts";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { CALIBRATION_WIZARD_STEPS, type WizardStepId } from "@my-ai-orchestrator/domain";
import {
  aggregateDeterministicFeatures,
  computeConsistencyScore,
  computeTopicIndependenceScore,
  extractDeterministicFeatures,
  type DeterministicFeatures
} from "./deterministic-extraction.js";
import { resolveTextLengthBucket, type TextLengthBucket } from "./voice-calibration-service-helpers.js";
import { isWizardVoiceExample, resolveWizardStepId, resolveWizardTopicTag } from "./wizard-voice-examples.js";

export type OpeningPattern = "question" | "statement" | "context";
export type ClosingPattern = "conclusion" | "open" | "question";

export interface StepObservation {
  readonly stepId: WizardStepId;
  readonly textLengthBucket: TextLengthBucket;
  readonly topicTag: string;
  readonly features: DeterministicFeatures;
  readonly openingPattern: OpeningPattern;
  readonly closingPattern: ClosingPattern;
}

export interface SuggestedReasoningTraits {
  readonly certaintyLevel: CertaintyLevel;
  readonly judgmentFrequency: JudgmentFrequency;
  readonly conclusionPace: ConclusionPace;
  readonly readerRelationship: ReaderRelationship;
  readonly authoritySource: AuthoritySource;
}

export interface VoiceSignatureBrief {
  readonly aggregate: DeterministicFeatures;
  readonly consistencyScore: number;
  readonly topicIndependenceScore: number;
  readonly stepObservations: readonly StepObservation[];
  readonly suggestedReasoning: SuggestedReasoningTraits;
  readonly structuralNotes: readonly string[];
}

const STOPWORDS = new Set([
  "a",
  "o",
  "e",
  "de",
  "da",
  "do",
  "em",
  "um",
  "uma",
  "os",
  "as",
  "que",
  "para",
  "com",
  "nao",
  "mais",
  "como",
  "por",
  "se",
  "eu",
  "voce",
  "isso",
  "essa",
  "esse",
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "you",
  "are",
  "was",
  "have",
  "has",
  "been",
  "about",
  "when",
  "what",
  "why",
  "how"
]);

function splitSentences(text: string): readonly string[] {
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  return sentences.length > 0 ? sentences : [text.trim()].filter(Boolean);
}

function detectOpeningPattern(firstSentence: string): OpeningPattern {
  const trimmed = firstSentence.trim();
  if (trimmed.endsWith("?")) {
    return "question";
  }

  if (/^(quando|when|while|enquanto|se |if |ao |after|depois|antes|before)/i.test(trimmed)) {
    return "context";
  }

  return "statement";
}

function detectClosingPattern(lastSentence: string): ClosingPattern {
  const trimmed = lastSentence.trim();
  if (trimmed.endsWith("?")) {
    return "question";
  }

  if (
    /\b(portanto|therefore|assim|thus|em resumo|in summary|conclusao|conclusion|no fim|finally)\b/i.test(
      trimmed
    )
  ) {
    return "conclusion";
  }

  return "open";
}

function resolveExampleTextLengthBucket(
  example: VoiceExampleRecord,
  wordCount: number
): TextLengthBucket {
  const bucket = example.textLengthBucket;
  if (bucket === "short" || bucket === "medium" || bucket === "long") {
    return bucket;
  }

  return resolveTextLengthBucket(wordCount);
}

function buildStepObservation(example: VoiceExampleRecord): StepObservation {
  const text = example.text.trim();
  const sentences = splitSentences(text);
  const wordCount = text.split(/\s+/).filter((token) => token.length > 0).length;
  const features = example.deterministicFeatures ?? extractDeterministicFeatures(text);

  return {
    stepId: resolveWizardStepId(example) ?? "micro_opinion",
    textLengthBucket: resolveExampleTextLengthBucket(example, wordCount),
    topicTag: resolveWizardTopicTag(example),
    features,
    openingPattern: detectOpeningPattern(sentences[0] ?? text),
    closingPattern: detectClosingPattern(sentences[sentences.length - 1] ?? text)
  };
}

function levelFromRatio(ratio: number, low: number, high: number): "low" | "moderate" | "high" {
  if (ratio <= low) {
    return "low";
  }

  if (ratio >= high) {
    return "high";
  }

  return "moderate";
}

function inferSuggestedReasoningTraits(
  aggregate: DeterministicFeatures,
  observations: readonly StepObservation[]
): SuggestedReasoningTraits {
  const hedging = aggregate.hedgingMarkerCount;
  const certainty = aggregate.certaintyMarkerCount;
  const markerTotal = Math.max(1, hedging + certainty);
  const certaintyLevel = levelFromRatio(certainty / markerTotal, 0.2, 0.55);
  const judgmentFrequency = levelFromRatio(
    (aggregate.certaintyMarkerCount + aggregate.emotionalityScore * 3) /
      Math.max(1, aggregate.avgSentenceLength / 6),
    0.35,
    0.75
  );
  const conclusionPace =
    aggregate.avgSentenceLength >= 20 || aggregate.avgDependencyDepth >= 2
      ? "slow"
      : aggregate.avgSentenceLength <= 12
        ? "fast"
        : "moderate";
  const readerRelationship: ReaderRelationship =
    aggregate.formalityScore >= 0.65
      ? "mentor"
      : aggregate.formalityScore <= 0.35
        ? "peer"
        : "collaborator";
  const livedExperienceSteps = observations.filter((observation) =>
    ["reasoning_reflection", "argument_development"].includes(observation.stepId)
  ).length;
  const authoritySource: AuthoritySource =
    livedExperienceSteps >= 2 ? "lived_experience" : "personal_observation";

  return {
    certaintyLevel,
    judgmentFrequency,
    conclusionPace,
    readerRelationship,
    authoritySource
  };
}

function buildStructuralNotes(observations: readonly StepObservation[]): readonly string[] {
  const notes: string[] = [];
  const openings = new Set(observations.map((observation) => observation.openingPattern));
  const closings = new Set(observations.map((observation) => observation.closingPattern));

  if (openings.has("question")) {
    notes.push("Often opens with a question before developing the point.");
  }

  if (openings.has("context")) {
    notes.push("Frequently sets context before stating a position.");
  }

  if (closings.has("open")) {
    notes.push("Often leaves the ending open instead of closing with a firm thesis.");
  }

  if (closings.has("question")) {
    notes.push("Sometimes ends with a question to the reader.");
  }

  const aggregateTransitions = observations.reduce(
    (total, observation) => total + observation.features.transitionMarkerCount,
    0
  );
  if (aggregateTransitions >= 2) {
    notes.push("Uses explicit transition markers between argumentative moves.");
  }

  const longSteps = observations.filter((observation) => observation.textLengthBucket === "long");
  const shortSteps = observations.filter((observation) => observation.textLengthBucket === "short");
  if (longSteps.length > 0 && shortSteps.length > 0) {
    const longFormality =
      longSteps.reduce((total, step) => total + step.features.formalityScore, 0) / longSteps.length;
    const shortFormality =
      shortSteps.reduce((total, step) => total + step.features.formalityScore, 0) / shortSteps.length;
    if (longFormality - shortFormality >= 0.15) {
      notes.push("Register becomes more formal as texts grow longer.");
    } else if (shortFormality - longFormality >= 0.15) {
      notes.push("Keeps a lighter register even in longer texts.");
    }
  }

  return notes;
}

export function buildVoiceSignatureBrief(
  examples: readonly VoiceExampleRecord[]
): VoiceSignatureBrief | undefined {
  const wizardExamples = examples.filter((example) => example.state === "active" && isWizardVoiceExample(example));
  if (wizardExamples.length === 0) {
    return undefined;
  }

  const features = wizardExamples.map(
    (example) => example.deterministicFeatures ?? extractDeterministicFeatures(example.text)
  );
  const topicTags = wizardExamples.map(resolveWizardTopicTag);
  const stepObservations = wizardExamples.map(buildStepObservation);
  const aggregate = aggregateDeterministicFeatures(features);

  return {
    aggregate,
    consistencyScore: computeConsistencyScore(features),
    topicIndependenceScore: computeTopicIndependenceScore(features, topicTags),
    stepObservations,
    suggestedReasoning: inferSuggestedReasoningTraits(aggregate, stepObservations),
    structuralNotes: buildStructuralNotes(stepObservations)
  };
}

export function formatBriefForPrompt(brief: VoiceSignatureBrief): string {
  const stepLines = brief.stepObservations.map(
    (observation) =>
      [
        `- step=${observation.stepId}`,
        `length=${observation.textLengthBucket}`,
        `opening=${observation.openingPattern}`,
        `closing=${observation.closingPattern}`,
        `hedging=${observation.features.hedgingMarkerCount}`,
        `certainty=${observation.features.certaintyMarkerCount}`,
        `transitions=${observation.features.transitionMarkerCount}`,
        `avgSentenceLength=${observation.features.avgSentenceLength}`,
        `formality=${observation.features.formalityScore}`
      ].join(", ")
  );

  return [
    "== DETERMINISTIC SIGNATURE BRIEF ==",
    `consistencyScore=${brief.consistencyScore}`,
    `topicIndependenceScore=${brief.topicIndependenceScore}`,
    `aggregate.avgSentenceLength=${brief.aggregate.avgSentenceLength}`,
    `aggregate.formalityScore=${brief.aggregate.formalityScore}`,
    `aggregate.hedgingMarkerCount=${brief.aggregate.hedgingMarkerCount}`,
    `aggregate.certaintyMarkerCount=${brief.aggregate.certaintyMarkerCount}`,
    `aggregate.transitionMarkerCount=${brief.aggregate.transitionMarkerCount}`,
    `suggested.certaintyLevel=${brief.suggestedReasoning.certaintyLevel}`,
    `suggested.judgmentFrequency=${brief.suggestedReasoning.judgmentFrequency}`,
    `suggested.conclusionPace=${brief.suggestedReasoning.conclusionPace}`,
    `suggested.readerRelationship=${brief.suggestedReasoning.readerRelationship}`,
    `suggested.authoritySource=${brief.suggestedReasoning.authoritySource}`,
    `structuralNotes=${brief.structuralNotes.join(" | ") || "none"}`,
    "perStep:",
    ...stepLines
  ].join("\n");
}

function tokenizeForTopicLeakage(text: string): readonly string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
}

const WIZARD_STEP_TOPIC_TAGS = new Set<string>(CALIBRATION_WIZARD_STEPS.map((step) => step.id));

export function extractTopicKeywords(examples: readonly VoiceExampleRecord[]): readonly string[] {
  const frequencies = new Map<string, number>();

  for (const example of examples.filter((item) => item.state === "active")) {
    const topicTag = resolveWizardTopicTag(example);
    if (WIZARD_STEP_TOPIC_TAGS.has(topicTag)) {
      continue;
    }

    for (const token of tokenizeForTopicLeakage(topicTag)) {
      frequencies.set(token, (frequencies.get(token) ?? 0) + 3);
    }
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 16)
    .map(([token]) => token);
}

export function detectTopicLeakage(
  prose: string,
  examples: readonly VoiceExampleRecord[],
  minHits = 2
): boolean {
  const normalizedProse = prose
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const keywords = extractTopicKeywords(examples).slice(0, 12);
  if (keywords.length === 0) {
    return false;
  }

  const hits = keywords.filter((keyword) => normalizedProse.includes(keyword)).length;
  return hits >= minHits;
}

export const TOPIC_LEAKAGE_RETRY_SUFFIX =
  "\n\nRETRY: Your previous prose mentioned topic-specific words from the examples. Rewrite narrativeProse/developmentProse to describe ONLY how the author thinks or develops texts. Do not mention themes, products, opinions, or vocabulary from the examples.";

export const ANTI_TOPIC_EXTRACTION_RULES = [
  "Describe HOW the author thinks or develops texts — never WHAT they wrote about.",
  "Do not mention specific topics, products, names, themes, or opinions from the examples.",
  "Prefer patterns that repeat across examples with different topics.",
  "Use the deterministic signature brief as ground truth for quantitative traits.",
  "Do not copy or paraphrase example sentences."
].join("\n");
