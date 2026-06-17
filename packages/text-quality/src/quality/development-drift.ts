import type { ArgumentDevelopmentSignature } from "@my-ai-orchestrator/contracts";
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

export function evaluateArgumentDevelopmentDrift(
  development: ArgumentDevelopmentSignature | undefined,
  candidate: string,
  stepName?: string
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
    development.epistemicPosture === "advocacy_mixed"
    && structuralStep
    && HEDGING_MARKERS.some((pattern) => pattern.test(normalized))
  ) {
    score -= 25;
    notes.push("Candidate hedges excessively for advocacy-mixed development posture");
  }

  if (
    development.epistemicPosture === "advocacy_mixed"
    && structuralStep
    && development.structuralAntiPatterns.some((pattern) => /slow|warmup|digression/.test(pattern))
    && /antes de|vamos percorrer|sem fechar|sem chegar/.test(normalized)
  ) {
    score -= 30;
    notes.push("Candidate delays the thesis for advocacy-mixed development posture");
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
