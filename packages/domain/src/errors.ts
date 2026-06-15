import type { NextActionCode, ReasonCode } from "@my-ai-orchestrator/contracts";
import { Data } from "effect";

export const canonicalReasonCodes = [
  "insufficient_examples",
  "insufficient_diversity",
  "conflicting_signals",
  "processing_failed",
  "plan_restriction",
  "feature_flag_disabled",
  "rebuild_failed",
  "rebuild_in_progress",
  "language_conflict",
  "too_many_pinned_examples",
  "invalid_example_payload",
  "batch_expired"
] as const satisfies readonly ReasonCode[];

export const canonicalNextActionCodes = [
  "add_more_examples",
  "add_examples_from_other_content_types",
  "review_conflicting_examples",
  "remove_pinned_example",
  "retry_batch_commit",
  "wait_for_profile_update",
  "upgrade_plan"
] as const satisfies readonly NextActionCode[];

export const reasonCodeDefaultNextActions: Readonly<Record<ReasonCode, readonly NextActionCode[]>> = {
  insufficient_examples: ["add_more_examples"],
  insufficient_diversity: ["add_examples_from_other_content_types"],
  conflicting_signals: ["review_conflicting_examples"],
  processing_failed: ["wait_for_profile_update"],
  plan_restriction: ["upgrade_plan"],
  feature_flag_disabled: ["wait_for_profile_update"],
  rebuild_failed: ["wait_for_profile_update"],
  rebuild_in_progress: ["wait_for_profile_update"],
  language_conflict: ["review_conflicting_examples"],
  too_many_pinned_examples: ["remove_pinned_example"],
  invalid_example_payload: ["retry_batch_commit"],
  batch_expired: ["retry_batch_commit"]
};

export function nextActionCodesForReason(reasonCode: ReasonCode): readonly NextActionCode[] {
  return reasonCodeDefaultNextActions[reasonCode];
}

export class VoiceExampleValidationError extends Data.TaggedError("VoiceExampleValidationError")<{
  readonly reasonCode: ReasonCode;
  readonly message: string;
  readonly field?: string;
}> {}

export class VoiceBatchNotFoundError extends Data.TaggedError("VoiceBatchNotFoundError")<{
  readonly batchId: string;
}> {}

export class VoiceBatchExpiredError extends Data.TaggedError("VoiceBatchExpiredError")<{
  readonly batchId: string;
  readonly expiredAt?: string;
}> {}

export class VoiceProfileRebuildFailedError extends Data.TaggedError("VoiceProfileRebuildFailedError")<{
  readonly userId: string;
  readonly reasonCode: Extract<ReasonCode, "processing_failed" | "conflicting_signals" | "insufficient_examples" | "insufficient_diversity" | "language_conflict">;
  readonly message: string;
}> {}

export class VoicePinnedLimitExceededError extends Data.TaggedError("VoicePinnedLimitExceededError")<{
  readonly userId: string;
  readonly attemptedPinnedCount: number;
  readonly pinnedLimit: number;
}> {}

export class ContentTypeUnavailableError extends Data.TaggedError("ContentTypeUnavailableError")<{
  readonly contentTypeId: string;
  readonly reasonCode: Extract<ReasonCode, "plan_restriction" | "feature_flag_disabled">;
}> {}
