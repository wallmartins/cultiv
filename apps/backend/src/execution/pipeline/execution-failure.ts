import { BackendExecutionFailedError } from "../../http/errors.js";

export type BackendExecutionFailureReason =
  | "pipeline_step_failed"
  | "language_gate_failed"
  | "runtime_empty_result"
  | "provider_attempts_exhausted"
  | "quality_candidate_missing"
  | "voice_profile_unavailable"
  | "output_release_blocked"
  | "output_release_evaluation_failed"
  | "unexpected_execution_failure";

export function createExecutionFailure(args: {
  readonly message: string;
  readonly reason: BackendExecutionFailureReason;
}): BackendExecutionFailedError {
  return new BackendExecutionFailedError({
    message: args.message,
    reason: args.reason
  });
}

export function normalizeExecutionFailure(
  error: unknown,
  fallback: {
    readonly message: string;
    readonly reason: BackendExecutionFailureReason;
  }
): BackendExecutionFailedError {
  if (error instanceof BackendExecutionFailedError) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return createExecutionFailure({
      message: `${fallback.message}: ${error.message}`,
      reason: fallback.reason
    });
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return createExecutionFailure({
      message: `${fallback.message}: ${error.trim()}`,
      reason: fallback.reason
    });
  }

  return createExecutionFailure(fallback);
}
