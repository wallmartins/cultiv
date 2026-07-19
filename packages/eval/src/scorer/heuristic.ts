import type { QuantitativeSignals, TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import {
  criticizeText,
  evaluateArgumentDevelopmentDrift,
  evaluateFidelity,
  evaluateReasoningDrift,
  scoreCandidate,
  type CriticFinding
} from "@my-ai-orchestrator/text-quality";
import type { HeuristicScore } from "../types.js";

const FILLER_PATTERNS = [
  /\bessentially\b/giu,
  /\bbasically\b/giu,
  /\bactually\b/giu,
  /\bna verdade\b/giu,
  /\bno fundo\b/giu
];

export interface HeuristicScoreOptions {
  readonly reference?: string;
  readonly stepName?: string;
  readonly quantitativeSignals?: QuantitativeSignals;
}

export function scoreHeuristic(
  text: string,
  voiceProfile: TextQualityVoiceProfile | undefined,
  options?: HeuristicScoreOptions
): HeuristicScore {
  const reasoningEnabled = Boolean(voiceProfile?.coreReasoningSignature);
  const quantitativeSignals = options?.quantitativeSignals ?? voiceProfile?.quantitativeSignals;

  const criticResult = criticizeText(text, voiceProfile);

  const reasoningDrift = evaluateReasoningDrift(
    voiceProfile?.coreReasoningSignature,
    text,
    options?.stepName
  );

  const developmentDrift = evaluateArgumentDevelopmentDrift(
    voiceProfile?.argumentDevelopmentSignature,
    text,
    options?.stepName,
    quantitativeSignals
  );

  const fidelityResult = options?.reference
    ? evaluateFidelity(options.reference, text)
    : { score: 100, passed: true, notes: [] };

  const driftScore = reasoningEnabled
    ? Math.round((reasoningDrift.score + developmentDrift.score) / 2)
    : reasoningDrift.score;

  const candidateScore = scoreCandidate({
    criticScore: criticResult.score,
    fidelityScore: fidelityResult.score,
    driftScore,
    strategy: "balanced",
    reasoningEvaluationEnabled: reasoningEnabled
  });

  const fillerFinding = detectFillerWords(text);
  const findings: readonly CriticFinding[] = fillerFinding
    ? [fillerFinding, ...criticResult.findings]
    : criticResult.findings;

  const adjustedCriticScore = computeCriticScoreFromFindings(findings);

  const adjustedCandidateScore = scoreCandidate({
    criticScore: adjustedCriticScore,
    fidelityScore: fidelityResult.score,
    driftScore,
    strategy: "balanced",
    reasoningEvaluationEnabled: reasoningEnabled
  });

  return {
    score: adjustedCandidateScore.finalScore,
    subScores: {
      critic: adjustedCriticScore,
      fidelity: adjustedCandidateScore.fidelityScore,
      drift: adjustedCandidateScore.driftScore,
      developmentDrift: developmentDrift.score,
      lexical: computeLexicalScore(text)
    },
    findings
  };
}

function computeCriticScoreFromFindings(findings: readonly CriticFinding[]): number {
  const penalty = findings.reduce((total, finding) => total + severityPenalty(finding.severity), 0);
  return Math.max(0, 100 - penalty);
}

function severityPenalty(severity: CriticFinding["severity"]): number {
  if (severity === "high") return 40;
  if (severity === "medium") return 20;
  return 8;
}

function detectFillerWords(text: string): CriticFinding | undefined {
  const normalized = text.toLowerCase();
  const fillerHits = FILLER_PATTERNS.filter((pattern) => pattern.test(normalized)).length;

  if (fillerHits >= 2) {
    return {
      type: "llmish",
      severity: "medium",
      message: "Text uses filler hedges that add no meaning"
    };
  }

  return undefined;
}

function computeLexicalScore(text: string): number {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const words = normalized
    .split(/[^a-z0-9]+/iu)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (words.length === 0) {
    return 0;
  }

  const uniqueWords = new Set(words);
  const typeTokenRatio = uniqueWords.size / words.length;
  return Math.min(100, Math.round(typeTokenRatio * 100));
}
