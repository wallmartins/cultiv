import type { QualityMode, QuantitativeSignals } from "@my-ai-orchestrator/contracts";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";

export type VoiceJudgeSkipReason =
  | "reasoning_signature_flag_disabled"
  | "missing_core_reasoning_signature"
  | "quality_mode_fast"
  | "no_candidates"
  | "no_ranked_candidate"
  | "balanced_policy_not_triggered";

export type VoiceJudgeTriggerReason =
  | "strict_mode"
  | "reasoning_borderline"
  | "development_borderline"
  | "top_two_tie";

function isBorderline(score: number | undefined): boolean {
  return typeof score === "number" && score >= 60 && score <= 80;
}

export function resolveDevelopmentDriftThreshold(signals?: QuantitativeSignals): number {
  const base = 75;
  if (!signals) {
    return base;
  }
  if (signals.consistencyScore > 0.8) {
    return base + 5;
  }
  if (signals.consistencyScore < 0.5) {
    return base - 5;
  }
  return base;
}

function isDevelopmentDriftBorderline(
  score: number | undefined,
  signals?: QuantitativeSignals
): boolean {
  if (typeof score !== "number") {
    return false;
  }

  const threshold = resolveDevelopmentDriftThreshold(signals);
  return score >= threshold - 15 && score <= threshold;
}

export function resolveVoiceJudgeTrigger(args: {
  readonly qualityMode: QualityMode;
  readonly candidates: readonly CandidateText[];
  readonly quantitativeSignals?: QuantitativeSignals;
}): VoiceJudgeTriggerReason | undefined {
  if (args.qualityMode === "strict") {
    return "strict_mode";
  }

  if (args.qualityMode !== "balanced") {
    return undefined;
  }

  const ranked = [...args.candidates].sort((left, right) => right.score.finalScore - left.score.finalScore);
  const top = ranked[0];
  const runnerUp = ranked[1];

  if (!top) {
    return undefined;
  }

  const reasoningBorderline = isBorderline(top.drift.reasoningScore ?? top.drift.score);
  const developmentBorderline = isDevelopmentDriftBorderline(
    top.drift.developmentScore,
    args.quantitativeSignals
  );
  const tied =
    runnerUp !== undefined
    && Math.abs(top.score.finalScore - runnerUp.score.finalScore) <= 2;

  if (reasoningBorderline) {
    return "reasoning_borderline";
  }

  if (developmentBorderline) {
    return "development_borderline";
  }

  if (tied) {
    return "top_two_tie";
  }

  return undefined;
}

export function explainVoiceJudgeSkip(args: {
  readonly qualityMode: QualityMode;
  readonly reasoningSignatureEnabled: boolean;
  readonly voiceProfile: VoiceProfile;
  readonly candidates: readonly CandidateText[];
}): VoiceJudgeSkipReason | undefined {
  if (!args.reasoningSignatureEnabled) {
    return "reasoning_signature_flag_disabled";
  }

  if (!args.voiceProfile.coreReasoningSignature) {
    return "missing_core_reasoning_signature";
  }

  if (args.qualityMode === "fast") {
    return "quality_mode_fast";
  }

  if (args.candidates.length === 0) {
    return "no_candidates";
  }

  if (
    resolveVoiceJudgeTrigger({
      qualityMode: args.qualityMode,
      candidates: args.candidates,
      quantitativeSignals: args.voiceProfile.quantitativeSignals
    })
  ) {
    return undefined;
  }

  const ranked = [...args.candidates].sort((left, right) => right.score.finalScore - left.score.finalScore);
  if (!ranked[0]) {
    return "no_ranked_candidate";
  }

  return "balanced_policy_not_triggered";
}

export function shouldInvokeVoiceJudge(args: {
  readonly qualityMode: QualityMode;
  readonly reasoningSignatureEnabled: boolean;
  readonly voiceProfile: VoiceProfile;
  readonly candidates: readonly CandidateText[];
}): boolean {
  return explainVoiceJudgeSkip(args) === undefined;
}

export function selectVoiceJudgeCandidates(
  candidates: readonly CandidateText[]
): readonly CandidateText[] {
  return [...candidates]
    .sort((left, right) => right.score.finalScore - left.score.finalScore)
    .slice(0, 2);
}
