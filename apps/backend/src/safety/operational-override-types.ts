import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type { AuditRecord } from "@my-ai-orchestrator/database";
import type {
  SafetyClassificationCategory,
  SafetyDecisionOutcome,
  SafetyEvidenceBoundary,
  SafetyPolicyFamily
} from "../product/safety-policy/safety-policy-types.js";

export type OperationalOverrideLifecycleMode = "one_shot" | "time_limited";

export type OperationalOverrideDecisionReason =
  | "approved"
  | "missing_justification"
  | "broad_scope_not_allowed"
  | "expires_at_required"
  | "expires_at_in_past"
  | "lifetime_too_long"
  | "time_limited_not_allowed"
  | "non_overridable_family"
  | "non_overridable_boundary"
  | "non_overridable_category"
  | "override_not_found"
  | "override_expired"
  | "override_already_consumed";

export interface OperationalOverrideScope {
  readonly targetFamily: Exclude<SafetyPolicyFamily, "operational_override" | "policy_evidence">;
  readonly boundary: Exclude<SafetyEvidenceBoundary, "override">;
  readonly resourceId: string;
  readonly targetOutcome: SafetyDecisionOutcome;
  readonly categories: readonly SafetyClassificationCategory[];
  readonly fields: readonly string[];
  readonly pipelineName?: string;
  readonly stepName?: string;
}

export interface OperationalOverrideRequest {
  readonly operatorId: string;
  readonly justification: string;
  readonly scope: OperationalOverrideScope;
  readonly lifecycle?:
    | {
        readonly mode: "one_shot";
      }
    | {
        readonly mode: "time_limited";
        readonly expiresAt: string;
      };
}

export interface ApprovedOperationalOverride {
  readonly overrideId: string;
  readonly status: "approved";
  readonly reason: "approved";
  readonly operatorId: string;
  readonly requestedAt: string;
  readonly lifecycleMode: OperationalOverrideLifecycleMode;
  readonly expiresAt?: string;
  readonly scope: OperationalOverrideScope;
  readonly remainingUses: number;
}

export interface RejectedOperationalOverride {
  readonly overrideId: string;
  readonly status: "rejected";
  readonly reason: Exclude<OperationalOverrideDecisionReason, "approved" | "override_not_found" | "override_expired" | "override_already_consumed">;
  readonly operatorId: string;
  readonly requestedAt: string;
  readonly scope: OperationalOverrideScope;
  readonly message: string;
}

export type OperationalOverrideRequestDecision =
  | ApprovedOperationalOverride
  | RejectedOperationalOverride;

export interface OperationalOverrideConsumptionResult {
  readonly overrideId: string;
  readonly status: "consumed" | "active";
  readonly operatorId: string;
  readonly consumedAt: string;
  readonly scope: OperationalOverrideScope;
  readonly lifecycleMode: OperationalOverrideLifecycleMode;
  readonly expiresAt?: string;
  readonly remainingUses: number;
}

export interface BackendOperationalOverrideService {
  readonly requestOverride: (
    request: OperationalOverrideRequest
  ) => Effect.Effect<OperationalOverrideRequestDecision, DatabaseError>;
  readonly consumeOverride: (
    overrideId: string
  ) => Effect.Effect<
    OperationalOverrideConsumptionResult,
    import("../http/errors.js").BackendOperationalOverrideStateError | DatabaseError
  >;
}

export interface StoredOperationalOverrideGrant {
  readonly overrideId: string;
  readonly operatorId: string;
  readonly requestedAt: string;
  readonly justification: string;
  readonly scope: OperationalOverrideScope;
  readonly lifecycleMode: OperationalOverrideLifecycleMode;
  readonly expiresAt?: string;
  readonly remainingUses: number;
}

export interface PersistedOperationalOverrideGrant extends StoredOperationalOverrideGrant {
  readonly status: "active" | "consumed" | "expired";
  readonly consumedAt?: string;
  readonly expiredAt?: string;
}

export interface BackendOperationalOverrideDependencies {
  readonly database: import("@my-ai-orchestrator/database").DatabaseClient;
  readonly now: () => Date;
  readonly safetyPolicy: import("../product/safety-policy/safety-policy-types.js").BackendSafetyPolicyServiceContract;
  readonly policyEvidence?: import("./policy-evidence-types.js").BackendPolicyEvidenceService;
  readonly redaction?: import("./redaction-types.js").BackendRedactionService;
}

export type OverrideAuditActorType = Extract<AuditRecord["actorType"], "operator">;
