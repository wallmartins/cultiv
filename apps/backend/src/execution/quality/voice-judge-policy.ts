import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";

export function shouldInvokeVoiceJudge(args: {
  readonly qualityMode: QualityMode;
  readonly reasoningSignatureEnabled: boolean;
  readonly voiceProfile: VoiceProfile;
  readonly candidates: readonly CandidateText[];
}): boolean {
  if (!args.reasoningSignatureEnabled || !args.voiceProfile.coreReasoningSignature) {
    return false;
  }

  if (args.qualityMode === "fast") {
    return false;
  }

  if (args.candidates.length === 0) {
    return false;
  }

  if (args.qualityMode === "strict") {
    return true;
  }

  const ranked = [...args.candidates].sort((left, right) => right.score.finalScore - left.score.finalScore);
  const top = ranked[0];
  const runnerUp = ranked[1];

  if (!top) {
    return false;
  }

  const borderline = top.drift.score >= 60 && top.drift.score <= 80;
  const tied =
    runnerUp !== undefined
    && Math.abs(top.score.finalScore - runnerUp.score.finalScore) <= 2;

  return borderline || tied;
}

export function selectVoiceJudgeCandidates(
  candidates: readonly CandidateText[]
): readonly CandidateText[] {
  return [...candidates]
    .sort((left, right) => right.score.finalScore - left.score.finalScore)
    .slice(0, 2);
}
