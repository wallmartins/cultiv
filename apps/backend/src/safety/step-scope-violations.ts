import { Effect } from "effect";
import { BackendStepScopeViolationError } from "../http/errors.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";

export function failWithRecordedScopeViolation(args: {
  readonly stepName: string;
  readonly boundary: "read" | "write" | "handoff";
  readonly reason: BackendStepScopeViolationError["reason"];
  readonly field?: string;
  readonly fieldLabel?: "input" | "state";
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): Effect.Effect<never, never> {
  const violation = createStepScopeViolationError(args);
  return recordScopeViolationEvidence(args.policyEvidence, violation).pipe(
    Effect.zipRight(Effect.die(violation))
  );
}

export function failWithRecordedScopeViolationSync(args: {
  readonly stepName: string;
  readonly boundary: "read" | "write" | "handoff";
  readonly reason: BackendStepScopeViolationError["reason"];
  readonly field?: string;
  readonly fieldLabel?: "input" | "state";
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): never {
  const violation = createStepScopeViolationError(args);
  Effect.runSync(recordScopeViolationEvidence(args.policyEvidence, violation));
  throw violation;
}

function createStepScopeViolationError(args: {
  readonly stepName: string;
  readonly boundary: "read" | "write" | "handoff";
  readonly reason: BackendStepScopeViolationError["reason"];
  readonly field?: string;
  readonly fieldLabel?: "input" | "state";
}): BackendStepScopeViolationError {
  if (args.reason === "unauthorized_state_read" || args.reason === "unauthorized_input_read") {
    return new BackendStepScopeViolationError({
      stepName: args.stepName,
      boundary: "read",
      reason: args.reason,
      field: args.field,
      message: `Step "${args.stepName}" is not authorized to read ${args.fieldLabel ?? "state"} field "${args.field ?? "unknown"}"`
    });
  }

  if (args.reason === "unauthorized_metadata_write") {
    return new BackendStepScopeViolationError({
      stepName: args.stepName,
      boundary: "write",
      reason: args.reason,
      field: args.field,
      message: `Step "${args.stepName}" attempted to write unauthorized metadata field "${args.field ?? "metadata"}"`
    });
  }

  return new BackendStepScopeViolationError({
    stepName: args.stepName,
    boundary: "handoff",
    reason: "invalid_handoff_artifact",
    field: args.field,
    message: `Step "${args.stepName}" produced an invalid handoff artifact for "${args.field ?? args.stepName}"`
  });
}

function recordScopeViolationEvidence(
  policyEvidence: BackendPolicyEvidenceService | undefined,
  violation: BackendStepScopeViolationError
): Effect.Effect<void, never> {
  if (!policyEvidence) {
    return Effect.void;
  }

  const timestamp = new Date().toISOString();
  return policyEvidence.recordScopeEvidence({
    actorId: "system",
    actorType: "system",
    resourceId: `${violation.stepName}:${timestamp}`,
    outcome: "block",
    stepName: violation.stepName,
    boundary: violation.boundary,
    reason: violation.reason,
    field: violation.field ?? violation.stepName,
    occurredAt: timestamp
  }).pipe(Effect.orElse(swallowWithDiagnostic({
    operation: "Failed to persist scope violation evidence",
    context: {
      stepName: violation.stepName,
      boundary: violation.boundary,
      reason: violation.reason
    }
  })));
}
