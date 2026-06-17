import type { CandidateScoreBreakdown, QualityLaneStrategy } from "../types.js";
import type { ContentTypeQualityProfile } from "./content-type-quality-profile.js";

export interface CandidateScoreInput {
  readonly criticScore: number;
  readonly fidelityScore: number;
  readonly driftScore: number;
  readonly strategy: QualityLaneStrategy;
  readonly qualityProfile?: ContentTypeQualityProfile;
  readonly lexicalPenalty?: number;
  readonly reasoningEvaluationEnabled?: boolean;
}

export function scoreCandidate(input: CandidateScoreInput): CandidateScoreBreakdown {
  const criticScore = clamp(input.criticScore - (input.lexicalPenalty ?? 0));
  const fidelityScore = clamp(input.fidelityScore);
  const driftPenalty = 100 - clamp(input.driftScore);
  const strategyBonus = strategyBonusFor(input.strategy);
  const profile = input.qualityProfile;
  const reasoningEnabled = input.reasoningEvaluationEnabled === true;

  const criticWeight = profile?.criticWeight ?? (reasoningEnabled ? 0.25 : 0.3);
  const fidelityWeight = profile?.fidelityWeight ?? (reasoningEnabled ? 0.3 : 0.4);
  const driftWeight = profile?.driftWeight ?? (reasoningEnabled ? 0.4 : 0.25);

  const finalScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(criticScore * criticWeight + fidelityScore * fidelityWeight + driftPenalty * driftWeight + strategyBonus)
    )
  );

  return {
    criticScore: clamp(input.criticScore),
    fidelityScore,
    driftScore: clamp(input.driftScore),
    strategyBonus,
    finalScore
  };
}

function strategyBonusFor(strategy: QualityLaneStrategy): number {
  if (strategy === "conservative") return 2;
  if (strategy === "creative") return -1;
  return 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
