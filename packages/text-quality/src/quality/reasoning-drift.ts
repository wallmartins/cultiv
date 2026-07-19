import type { CoreReasoningSignature } from "@my-ai-orchestrator/contracts";
import type { VoiceDriftResult } from "../types.js";

const ABSOLUTE_PATTERNS = [
  /\bsempre\b/iu,
  /\bnunca\b/iu,
  /\btodo mundo\b/iu,
  /\bé claro que\b/iu,
  /\bobviamente\b/iu,
  /\bwithout doubt\b/iu,
  /\balways\b/iu,
  /\bnever\b/iu,
  /\bobviously\b/iu,
  /\bclearly\b/iu
];

const PRESCRIPTIVE_PATTERNS = [
  /\bvocê deve\b/iu,
  /\bvocê precisa\b/iu,
  /\bo certo é\b/iu,
  /\byou should\b/iu,
  /\byou must\b/iu,
  /\bthe right way\b/iu
];

const HEDGING_PATTERNS = [
  /\btalvez\b/iu,
  /\bpossivelmente\b/iu,
  /\bdependendo do contexto\b/iu,
  /\bmaybe\b/iu,
  /\bpossibly\b/iu,
  /\bit depends\b/iu
];

const GURU_CLAIM_PATTERNS = [
  /(?:única|unica)\s+forma/iu,
  /\bthe only way\b/iu,
  /\bsempre faça\b/iu
];

const SLOW_WARMUP_PATTERNS = [
  /\bantes de concluir\b/iu,
  /\bsem chegar ao ponto\b/iu,
  /\bvamos percorrer\b/iu,
  /\bbefore concluding\b/iu
];

const CONCLUSION_MARKERS = [
  /\bportanto\b/iu,
  /\blogo\b/iu,
  /\bem conclusão\b/iu,
  /\btherefore\b/iu,
  /\bin conclusion\b/iu,
  /\bthe takeaway\b/iu
];

export function evaluateReasoningDrift(
  core: CoreReasoningSignature | undefined,
  candidate: string,
  stepName?: string
): VoiceDriftResult {
  if (!core) {
    return { score: 100, notes: [] };
  }

  let score = 100;
  const notes: string[] = [];
  const normalized = candidate.toLowerCase();

  if (
    (core.certaintyLevel === "low" || core.certaintyLevel === "moderate")
    && ABSOLUTE_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 25;
    notes.push("Candidate uses absolutist language inconsistent with author certainty level");
  }

  if (
    core.judgmentFrequency === "low"
    && PRESCRIPTIVE_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 20;
    notes.push("Candidate sounds more prescriptive than the author's judgment frequency");
  }

  if (
    core.certaintyLevel === "high"
    && HEDGING_PATTERNS.filter((pattern) => pattern.test(normalized)).length >= 2
  ) {
    score -= 25;
    notes.push("Candidate hedges excessively for a high-certainty author");
  }

  if (hasRhetoricalInflation(candidate)) {
    score -= 20;
    notes.push("Candidate uses rhetorical inflation");
  }

  if (
    core.derivedAntiPatterns.some((item) => item.toLowerCase().includes("numbered thesis"))
    && (candidate.match(/\b\d+\./gu)?.length ?? 0) >= 2
  ) {
    score -= 20;
    notes.push("Candidate uses numbered thesis structure");
  }

  if (GURU_CLAIM_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 20;
    notes.push("Candidate makes absolute guru-style claims");
  }

  if (core.conclusionPace === "fast" && SLOW_WARMUP_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 25;
    notes.push("Candidate warms up too slowly for the author's fast conclusion pace");
  }

  if (core.conclusionPace === "slow" && hasPrematureConclusion(candidate, stepName)) {
    score -= 20;
    notes.push("Candidate reaches a conclusion earlier than the author's typical pace");
  }

  for (const antiPattern of core.derivedAntiPatterns) {
    if (antiPattern.trim().length > 0 && normalized.includes(antiPattern.toLowerCase())) {
      score -= 15;
      notes.push(`Derived anti-pattern hit: ${antiPattern}`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    notes
  };
}

export function hasPrematureConclusion(candidate: string, stepName?: string): boolean {
  if (stepName === "hook" || stepName === "outline" || stepName === "structure") {
    return false;
  }

  const sentences = candidate
    .split(/[.!?]+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  if (sentences.length < 2) {
    return false;
  }

  const earlyWindow = sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.35))).join(" ");
  return CONCLUSION_MARKERS.some((pattern) => pattern.test(earlyWindow));
}

export function hasExcessCertainty(candidate: string): boolean {
  const normalized = candidate.toLowerCase();
  return ABSOLUTE_PATTERNS.filter((pattern) => pattern.test(normalized)).length >= 2;
}

export function hasRhetoricalInflation(candidate: string): boolean {
  return [
    /\brevolutionary\b/iu,
    /\bgame[- ]changer\b/iu,
    /\btransformative\b/iu,
    /\bsem precedentes\b/iu,
    /\brevolucion[aá]ri[oa]\b/iu,
    /\btransformar completamente\b/iu
  ].some((pattern) => pattern.test(candidate));
}
