import { Effect } from "effect";
import { persistBackendAuditEvent } from "../product/core/audit-trail.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import type {
  BackendPolicyEvidenceService,
  PolicyEvidenceRecord
} from "./policy-evidence-types.js";
import type { BackendRedactionService } from "./redaction-types.js";
import type { DatabaseClient } from "@my-ai-orchestrator/database";

export function createPolicyEvidenceRecorders(options: {
  readonly database: DatabaseClient;
  readonly policyVersion: string;
  readonly redaction: BackendRedactionService;
}) {
  const baseRecord = (
    boundary: PolicyEvidenceRecord["boundary"],
    args: {
      readonly actorId: string;
      readonly actorType: PolicyEvidenceRecord["actorType"];
      readonly resourceId: string;
      readonly outcome: PolicyEvidenceRecord["outcome"];
      readonly occurredAt: string;
      readonly metadata?: Readonly<Record<string, unknown>>;
      readonly action?: string;
    }
  ): PolicyEvidenceRecord => ({
    id: buildEvidenceId(boundary, args.resourceId, args.occurredAt, args.action),
    logicalKey: buildEvidenceLogicalKey(boundary, args.resourceId, args.occurredAt, args.action),
    boundary,
    outcome: args.outcome,
    actorId: args.actorId,
    actorType: args.actorType,
    policyVersion: options.policyVersion,
    resourceType: `policy_evidence:${boundary}`,
    resourceId: args.resourceId,
    occurredAt: args.occurredAt,
    metadata: args.metadata ? options.redaction.redactObject(args.metadata).redacted : {}
  });

  const persistEvidence = (record: PolicyEvidenceRecord): Effect.Effect<void, never> =>
    persistBackendAuditEvent(options.database, {
      logicalKey: record.logicalKey,
      actorId: record.actorId,
      actorType: record.actorType,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      mutationType: `policy_evidence.${record.boundary}.${record.outcome}`,
      occurredAt: record.occurredAt,
      metadata: {
        ...record.metadata,
        policyVersion: record.policyVersion
      }
    }, options.redaction).pipe(
      Effect.orElse(swallowWithDiagnostic({
        operation: "Failed to persist policy evidence audit record",
        context: {
          boundary: record.boundary,
          outcome: record.outcome,
          resourceId: record.resourceId
        }
      }))
    );

  return {
    recordInputEvidence: (args: Parameters<BackendPolicyEvidenceService["recordInputEvidence"]>[0]) =>
      persistEvidence(
        baseRecord("input", {
          actorId: args.actorId,
          actorType: args.actorType,
          resourceId: args.resourceId,
          outcome: args.outcome,
          occurredAt: args.occurredAt,
          metadata: {
            boundary: args.boundary,
            findingsCount: args.findings.length,
            findings: args.findings.map((f) => ({ category: f.category, field: f.field })),
            overrideAttempt: args.overrideAttempt ?? null,
            rationaleCategory: args.findings[0]?.category ?? (args.overrideAttempt ? `override_${args.overrideAttempt.verdict}` : args.outcome),
            summary: buildInputEvidenceSummary(args)
          }
        })
      ),

    recordOutputEvidence: (args: Parameters<BackendPolicyEvidenceService["recordOutputEvidence"]>[0]) =>
      persistEvidence(
        baseRecord("output", {
          actorId: args.actorId,
          actorType: args.actorType,
          resourceId: args.resourceId,
          outcome: args.outcome,
          occurredAt: args.occurredAt,
          metadata: {
            contentType: args.contentType,
            findingsCount: args.findings.length,
            findings: args.findings.map((f) => ({ category: f.category, field: f.field, sanitized: f.sanitized ?? false })),
            rationaleCategory: args.findings[0]?.category ?? args.outcome,
            summary: buildOutputEvidenceSummary(args)
          }
        })
      ),

    recordScopeEvidence: (args: Parameters<BackendPolicyEvidenceService["recordScopeEvidence"]>[0]) =>
      persistEvidence(
        baseRecord("scope", {
          actorId: args.actorId,
          actorType: args.actorType,
          resourceId: args.resourceId,
          outcome: args.outcome,
          occurredAt: args.occurredAt,
          metadata: {
            stepName: args.stepName,
            boundary: args.boundary,
            reason: args.reason,
            field: args.field,
            rationaleCategory: args.reason,
            summary: buildScopeEvidenceSummary(args)
          }
        })
      ),

    recordConsentEvidence: (args: Parameters<BackendPolicyEvidenceService["recordConsentEvidence"]>[0]) =>
      persistEvidence(
        baseRecord("consent", {
          actorId: args.actorId,
          actorType: args.actorType,
          resourceId: args.resourceId,
          outcome: args.outcome,
          occurredAt: args.occurredAt,
          action: args.consentAction,
          metadata: {
            consentAction: args.consentAction,
            rationaleCategory: `consent_${args.consentAction}`,
            summary: buildConsentEvidenceSummary(args)
          }
        })
      ),

    recordOverrideEvidence: (args: Parameters<BackendPolicyEvidenceService["recordOverrideEvidence"]>[0]) =>
      persistEvidence(
        baseRecord("override", {
          actorId: args.actorId,
          actorType: args.actorType,
          resourceId: args.resourceId,
          outcome: args.outcome,
          occurredAt: args.occurredAt,
          metadata: {
            targetFamily: args.targetFamily,
            targetBoundary: args.targetBoundary,
            targetOutcome: args.targetOutcome,
            categories: args.categories,
            lifecycleMode: args.lifecycleMode,
            expiresAt: args.expiresAt,
            rationaleCategory: args.reason,
            summary: buildOverrideEvidenceSummary(args)
          }
        })
      )
  } satisfies Pick<
    BackendPolicyEvidenceService,
    "recordInputEvidence" | "recordOutputEvidence" | "recordScopeEvidence" | "recordConsentEvidence" | "recordOverrideEvidence"
  >;
}

function buildInputEvidenceSummary(args: Parameters<BackendPolicyEvidenceService["recordInputEvidence"]>[0]): string {
  const primaryCategory = args.findings[0]?.category;
  const overrideSummary = args.overrideAttempt
    ? `; override verdict ${args.overrideAttempt.verdict}${args.overrideAttempt.confidence ? ` (${args.overrideAttempt.confidence})` : ""}`
    : "";
  return `${args.boundary} input ${args.outcome} with ${args.findings.length} finding(s)${primaryCategory ? `; primary category ${primaryCategory}` : ""}${overrideSummary}`;
}

function buildOutputEvidenceSummary(args: Parameters<BackendPolicyEvidenceService["recordOutputEvidence"]>[0]): string {
  const primaryCategory = args.findings[0]?.category;
  return `output release ${args.outcome} for ${args.contentType} with ${args.findings.length} finding(s)${primaryCategory ? `; primary category ${primaryCategory}` : ""}`;
}

function buildScopeEvidenceSummary(args: Parameters<BackendPolicyEvidenceService["recordScopeEvidence"]>[0]): string {
  return `scope ${args.boundary} ${args.outcome} in step ${args.stepName} due to ${args.reason} on field ${args.field}`;
}

function buildConsentEvidenceSummary(args: Parameters<BackendPolicyEvidenceService["recordConsentEvidence"]>[0]): string {
  return `consent ${args.consentAction} recorded with outcome ${args.outcome}`;
}

function buildOverrideEvidenceSummary(args: Parameters<BackendPolicyEvidenceService["recordOverrideEvidence"]>[0]): string {
  const categoriesSummary = args.categories.length > 0 ? `; categories ${args.categories.join(", ")}` : "";
  const expirySummary = args.expiresAt ? `; expires at ${args.expiresAt}` : "";
  return `override ${args.outcome} for ${args.targetFamily}/${args.targetBoundary} targeting ${args.targetOutcome}; lifecycle ${args.lifecycleMode}${categoriesSummary}${expirySummary}; reason ${args.reason}`;
}

function buildEvidenceId(boundary: string, resourceId: string, occurredAt: string, action?: string): string {
  return `policy-evidence:${boundary}:${resourceId}:${occurredAt}${action ? `:${action}` : ""}`;
}

function buildEvidenceLogicalKey(boundary: string, resourceId: string, occurredAt: string, action?: string): string {
  return `policy-evidence:${boundary}:${resourceId}:${occurredAt}${action ? `:${action}` : ""}`;
}
