import { Effect } from "effect";
import { persistBackendAuditEvent } from "../product/core/audit-trail.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import { createClassifiedRedactionValue } from "./redaction-types.js";
import type {
  BackendOperationalOverrideDependencies,
  OperationalOverrideRequest,
  OperationalOverrideRequestDecision,
  StoredOperationalOverrideGrant
} from "./operational-override-types.js";

export function recordOperationalOverrideAttempt(
  decision: OperationalOverrideRequestDecision,
  request: OperationalOverrideRequest,
  deps: BackendOperationalOverrideDependencies
): Effect.Effect<void, never> {
  const occurredAt = decision.requestedAt;
  const outcome = decision.status === "approved" ? "approve" : "block";
  const lifecycleMode = decision.status === "approved" ? decision.lifecycleMode : request.lifecycle?.mode ?? "one_shot";

  const evidence = deps.policyEvidence?.recordOverrideEvidence({
    actorId: request.operatorId,
    actorType: "operator",
    resourceId: decision.overrideId,
    outcome,
    occurredAt,
    targetFamily: request.scope.targetFamily,
    targetBoundary: request.scope.boundary,
    targetOutcome: request.scope.targetOutcome,
    categories: request.scope.categories,
    lifecycleMode,
    expiresAt: decision.status === "approved" ? decision.expiresAt : request.lifecycle?.mode === "time_limited" ? request.lifecycle.expiresAt : undefined,
    reason: decision.status === "approved" ? "approved" : decision.reason
  }).pipe(Effect.orElse(swallowWithDiagnostic({
    operation: "Failed to persist override policy evidence",
    context: {
      operatorId: request.operatorId,
      overrideId: decision.overrideId,
      status: decision.status
    }
  }))) ?? Effect.void;

  const audit = persistBackendAuditEvent(
    deps.database,
    {
      logicalKey: `safety-override:${decision.overrideId}:${decision.status}`,
      actorId: request.operatorId,
      actorType: "operator",
      resourceType: "safety_override",
      resourceId: decision.overrideId,
      mutationType: decision.status === "approved" ? "safety_override.approved" : "safety_override.rejected",
      occurredAt,
      metadata: {
        targetFamily: request.scope.targetFamily,
        targetBoundary: request.scope.boundary,
        targetOutcome: request.scope.targetOutcome,
        categories: [...request.scope.categories],
        fields: [...request.scope.fields],
        pipelineName: request.scope.pipelineName,
        stepName: request.scope.stepName,
        lifecycleMode,
        expiresAt: decision.status === "approved" ? decision.expiresAt : request.lifecycle?.mode === "time_limited" ? request.lifecycle.expiresAt : undefined,
        decisionReason: decision.status === "approved" ? "approved" : decision.reason,
        justification: createClassifiedRedactionValue("operational_data", request.justification)
      }
    },
    deps.redaction
  ).pipe(
    Effect.asVoid,
    Effect.orElse(swallowWithDiagnostic({
      operation: "Failed to persist override audit event",
      context: {
        overrideId: decision.overrideId,
        status: decision.status
      }
    }))
  );

  return Effect.zipRight(evidence, audit);
}

export function recordOperationalOverrideLifecycleEvent(
  eventType: "consumed" | "expired",
  grant: StoredOperationalOverrideGrant,
  occurredAt: string,
  deps: BackendOperationalOverrideDependencies
): Effect.Effect<void, never> {
  return persistBackendAuditEvent(
    deps.database,
    {
      logicalKey: `safety-override:${grant.overrideId}:${eventType}:${occurredAt}`,
      actorId: grant.operatorId,
      actorType: "operator",
      resourceType: "safety_override",
      resourceId: grant.overrideId,
      mutationType: `safety_override.${eventType}`,
      occurredAt,
      metadata: {
        targetFamily: grant.scope.targetFamily,
        targetBoundary: grant.scope.boundary,
        targetOutcome: grant.scope.targetOutcome,
        lifecycleMode: grant.lifecycleMode,
        expiresAt: grant.expiresAt,
        remainingUses: grant.remainingUses
      }
    },
    deps.redaction
  ).pipe(
    Effect.asVoid,
    Effect.orElse(swallowWithDiagnostic({
      operation: "Failed to persist override lifecycle audit event",
      context: {
        overrideId: grant.overrideId,
        eventType
      }
    }))
  );
}
