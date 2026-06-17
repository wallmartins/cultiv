import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";

export function explainVoiceJudgeSkip(args: {
  readonly qualityMode: QualityMode;
  readonly reasoningSignatureEnabled: boolean;
  readonly voiceProfile: VoiceProfile;
  readonly candidates: readonly CandidateText[];
}): string | undefined {
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

  if (args.qualityMode === "strict") {
    return undefined;
  }

  const ranked = [...args.candidates].sort((left, right) => right.score.finalScore - left.score.finalScore);
  const top = ranked[0];
  const runnerUp = ranked[1];

  if (!top) {
    return "no_ranked_candidate";
  }

  const borderline = top.drift.score >= 60 && top.drift.score <= 80;
  const tied =
    runnerUp !== undefined
    && Math.abs(top.score.finalScore - runnerUp.score.finalScore) <= 2;

  if (borderline || tied) {
    return undefined;
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
