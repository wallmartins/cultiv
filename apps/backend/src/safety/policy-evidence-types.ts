import { Effect } from "effect";

export type PolicyEvidenceBoundary = "input" | "scope" | "output" | "consent" | "override";

export type PolicyEvidenceOutcome = "approve" | "sanitize" | "quarantine" | "block" | "clear" | "observe" | "require_override" | "revoked" | "granted";

export interface PolicyEvidenceRecord {
  readonly id: string;
  readonly logicalKey: string;
  readonly boundary: PolicyEvidenceBoundary;
  readonly outcome: PolicyEvidenceOutcome;
  readonly actorId: string;
  readonly actorType: "application_user" | "operator" | "system";
  readonly policyVersion: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly occurredAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface PolicyEvidenceReadModelEntry {
  readonly id: string;
  readonly boundary: PolicyEvidenceBoundary;
  readonly outcome: PolicyEvidenceOutcome;
  readonly actorId: string;
  readonly actorType: "application_user" | "operator" | "system";
  readonly policyVersion: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly occurredAt: string;
  readonly rationaleCategory: string | null;
  readonly summary: string | null;
}

export interface PolicyEvidenceFilter {
  readonly boundary?: PolicyEvidenceBoundary;
  readonly outcome?: PolicyEvidenceOutcome;
  readonly actorId?: string;
  readonly resourceId?: string;
  readonly resourceType?: string;
  readonly since?: string;
  readonly until?: string;
}

export interface BackendPolicyEvidenceService {
  readonly recordInputEvidence: (args: {
    readonly actorId: string;
    readonly actorType: PolicyEvidenceRecord["actorType"];
    readonly resourceId: string;
    readonly outcome: PolicyEvidenceOutcome;
    readonly boundary: "preview" | "generation";
    readonly findings: readonly { readonly category: string; readonly field: string }[];
    readonly overrideAttempt?: { readonly verdict: string; readonly confidence?: string | null } | null;
    readonly occurredAt: string;
  }) => Effect.Effect<void, never>;

  readonly recordOutputEvidence: (args: {
    readonly actorId: string;
    readonly actorType: PolicyEvidenceRecord["actorType"];
    readonly resourceId: string;
    readonly outcome: PolicyEvidenceOutcome;
    readonly contentType: string;
    readonly findings: readonly { readonly category: string; readonly field: string; readonly sanitized?: boolean }[];
    readonly occurredAt: string;
  }) => Effect.Effect<void, never>;

  readonly recordScopeEvidence: (args: {
    readonly actorId: string;
    readonly actorType: PolicyEvidenceRecord["actorType"];
    readonly resourceId: string;
    readonly outcome: PolicyEvidenceOutcome;
    readonly stepName: string;
    readonly boundary: "read" | "write" | "handoff";
    readonly reason: string;
    readonly field: string;
    readonly occurredAt: string;
  }) => Effect.Effect<void, never>;

  readonly recordConsentEvidence: (args: {
    readonly actorId: string;
    readonly actorType: PolicyEvidenceRecord["actorType"];
    readonly resourceId: string;
    readonly outcome: PolicyEvidenceOutcome;
    readonly consentAction: "grant" | "revoke" | "assert";
    readonly occurredAt: string;
  }) => Effect.Effect<void, never>;

  readonly recordOverrideEvidence: (args: {
    readonly actorId: string;
    readonly actorType: PolicyEvidenceRecord["actorType"];
    readonly resourceId: string;
    readonly outcome: Extract<PolicyEvidenceOutcome, "approve" | "block">;
    readonly targetFamily: string;
    readonly targetBoundary: string;
    readonly targetOutcome: string;
    readonly categories: readonly string[];
    readonly lifecycleMode: "one_shot" | "time_limited";
    readonly reason: string;
    readonly expiresAt?: string;
    readonly occurredAt: string;
  }) => Effect.Effect<void, never>;

  readonly listOperationalEvidence: (filter: PolicyEvidenceFilter) => Effect.Effect<readonly PolicyEvidenceReadModelEntry[]>;
}
