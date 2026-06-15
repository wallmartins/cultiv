import { Effect } from "effect";
import type { StepOutput } from "@my-ai-orchestrator/core";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";
import type { BackendStepScopeContract } from "./step-scope-types.js";
import { failWithRecordedScopeViolation } from "./step-scope-violations.js";

export function validateMetadataWrites(args: {
  readonly scope: BackendStepScopeContract;
  readonly output: StepOutput;
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): Effect.Effect<void, never> {
  const metadataKeys = Object.keys(args.output.metadata ?? {});
  const unauthorizedKey = metadataKeys.find((key) => !args.scope.writes.metadataKeys.includes(key));

  if (!unauthorizedKey) {
    return Effect.void;
  }

  return failWithRecordedScopeViolation({
    stepName: args.scope.stepName,
    boundary: "write",
    reason: "unauthorized_metadata_write",
    field: unauthorizedKey,
    policyEvidence: args.policyEvidence
  });
}

export function validateHandoffArtifact(args: {
  readonly scope: BackendStepScopeContract;
  readonly output: StepOutput;
  readonly policyEvidence?: BackendPolicyEvidenceService;
}): Effect.Effect<string, never> {
  if (args.scope.handoff.outputKind !== "text") {
    return Effect.succeed(String(args.output.output ?? ""));
  }

  if (typeof args.output.output !== "string") {
    return failWithRecordedScopeViolation({
      stepName: args.scope.stepName,
      boundary: "handoff",
      reason: "invalid_handoff_artifact",
      field: args.scope.writes.outputKey,
      policyEvidence: args.policyEvidence
    });
  }

  if (args.scope.handoff.requireNonEmpty && args.output.output.trim().length === 0) {
    return failWithRecordedScopeViolation({
      stepName: args.scope.stepName,
      boundary: "handoff",
      reason: "invalid_handoff_artifact",
      field: args.scope.writes.outputKey,
      policyEvidence: args.policyEvidence
    });
  }

  return Effect.succeed(args.output.output);
}
