import type { ArgumentDevelopmentSignature, QuantitativeSignals } from "@my-ai-orchestrator/contracts";
import type { VoiceDriftResult } from "../types.js";

const THESIS_MARKERS = [
  /\bem conclusão\b/iu,
  /\bportanto\b/iu,
  /\ba conclusão é\b/iu,
  /\bin conclusion\b/iu,
  /\bthe takeaway\b/iu,
  /\bmy thesis\b/iu,
  /\bminha tese\b/iu
];

const ADVOCACY_MARKERS = [
  /\bvocê deve\b/iu,
  /\bo certo é\b/iu,
  /\ba única forma\b/iu,
  /\byou should\b/iu,
  /\bthe only way\b/iu,
  /\bsempre faça\b/iu
];

const DOUBT_MARKERS = [
  /\bduvida\b/iu,
  /\bincerto\b/iu,
  /\btalvez\b/iu,
  /\bnot sure\b/iu,
  /\bi wonder\b/iu,
  /\bserá que\b/iu
];

const HEDGING_MARKERS = [
  /\btalvez\b/iu,
  /\bpossivelmente\b/iu,
  /\bdependendo do contexto\b/iu,
  /\bem alguns casos\b/iu,
  /\bnot sure\b/iu
];

const FORMAL_MARKERS =
  /\b(portanto|contudo|todavia|entretanto|outrossim|destarte|mediante|consoante|outorga|notoriamente)\b/gi;
const INFORMAL_MARKERS = /\b(cara|tipo|ne|pra|ta|vc|vcs|blz|show|massa|legal demais)\b/gi;

export function computeAvgSentenceLength(text: string): number {
  const sentences = text
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  if (sentences.length === 0) {
    return 0;
  }

  const lengths = sentences.map((sentence) => tokenizeWords(sentence).length);
  return lengths.reduce((total, length) => total + length, 0) / lengths.length;
}

export function computeTypeTokenRatio(text: string): number {
  const words = tokenizeWords(text);
  if (words.length === 0) {
    return 0;
  }

  return new Set(words).size / words.length;
}

export function computeFormalityScore(text: string): number {
  const normalized = normalizeText(text);
  const formalCount = countMatches(normalized, FORMAL_MARKERS);
  const informalCount = countMatches(normalized, INFORMAL_MARKERS);
  const denominator = Math.max(1, formalCount + informalCount);
  return formalCount / denominator;
}

export function evaluateArgumentDevelopmentDrift(
  development: ArgumentDevelopmentSignature | undefined,
  candidate: string,
  stepName?: string,
  quantitativeSignals?: QuantitativeSignals
): VoiceDriftResult {
  if (!development) {
    return { score: 100, notes: [] };
  }

  let score = 100;
  const notes: string[] = [];
  const normalized = candidate.toLowerCase();
  const structuralStep = stepName === "draft" || stepName === "expand" || stepName === undefined;

  if (development.epistemicPosture === "exploratory" && ADVOCACY_MARKERS.some((pattern) => pattern.test(normalized))) {
    score -= 25;
    notes.push("Candidate uses advocacy language inconsistent with exploratory development posture");
  }

  if (
    development.epistemicPosture === "investigative"
    && ADVOCACY_MARKERS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 25;
    notes.push("Candidate uses advocacy language inconsistent with investigative development posture");
  }

  if (
    development.epistemicPosture === "advocacy"
    && structuralStep
    && HEDGING_MARKERS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 25;
    notes.push("Candidate hedges excessively for advocacy development posture");
  }

  if (
    development.epistemicPosture === "advocacy"
    && structuralStep
    && development.structuralAntiPatterns.some((pattern) => /slow|warmup|digression/.test(pattern))
    && /antes de|vamos percorrer|sem fechar|sem chegar/.test(normalized)
  ) {
    score -= 30;
    notes.push("Candidate delays the thesis for advocacy development posture");
  }

  if (
    development.structuralAntiPatterns.some((pattern) => /rhetorical|inflation|numbered|absolute|prescription/.test(pattern))
    && (ADVOCACY_MARKERS.some((pattern) => pattern.test(normalized)) || THESIS_MARKERS.some((pattern) => pattern.test(normalized)))
  ) {
    score -= 15;
    notes.push("Candidate matches a structural anti-pattern in development profile");
  }

  if (
    development.epistemicPosture === "exploratory"
    && structuralStep
    && hasPrematureThesis(candidate)
    && !DOUBT_MARKERS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 30;
    notes.push("Candidate defends a thesis early without exploratory moves");
  }

  if (
    development.structuralAntiPatterns.some((pattern) => /premature|tese_prematura|early_thesis/.test(pattern))
    && structuralStep
    && hasPrematureThesis(candidate)
  ) {
    score -= 20;
    notes.push("Candidate matches a structural anti-pattern: premature thesis");
  }

  if (
    development.structuralAntiPatterns.some((pattern) => /advocacy|arco_advocacia/.test(pattern))
    && ADVOCACY_MARKERS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 15;
    notes.push("Candidate matches a structural anti-pattern: advocacy arc");
  }

  if (quantitativeSignals) {
    const candidateAvgSentenceLength = computeAvgSentenceLength(candidate);
    const targetSentenceLength = quantitativeSignals.aggregate.avgSentenceLength;
    if (
      targetSentenceLength > 0
      && Math.abs(candidateAvgSentenceLength - targetSentenceLength) > targetSentenceLength * 0.25
    ) {
      score -= 15;
      notes.push("Candidate sentence length drifts from quantitative profile");
    }

    const targetFormality = quantitativeSignals.aggregate.formalityScore;
    const candidateFormality = computeFormalityScore(candidate);
    if (Math.abs(candidateFormality - targetFormality) > 0.2) {
      score -= 10;
      notes.push("Candidate formality drifts from quantitative profile");
    }

    const targetTtr = quantitativeSignals.aggregate.typeTokenRatio;
    const candidateTtr = computeTypeTokenRatio(candidate);
    if (targetTtr > 0 && candidateTtr < targetTtr * 0.7) {
      score -= 10;
      notes.push("Candidate vocabulary diversity is below quantitative profile");
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    notes
  };
}

function hasPrematureThesis(candidate: string): boolean {
  const paragraphs = candidate.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const firstThird = paragraphs.slice(0, Math.max(1, Math.ceil(paragraphs.length / 3))).join("\n");
  return THESIS_MARKERS.some((pattern) => pattern.test(firstThird));
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenizeWords(text: string): readonly string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches?.length ?? 0;
}
