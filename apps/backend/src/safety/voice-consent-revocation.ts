import { Effect } from "effect";
import { BackendVoiceTrainingConsentFailureError } from "../http/errors.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import { persistBackendAuditEvent } from "../product/core/audit-trail.js";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";
import type { BackendVoiceConsentDependencies } from "./voice-consent-shared.js";
import { buildVoiceConsentResourceId } from "./voice-consent-shared.js";

export function revokeVoiceTrainingConsent(
  userId: string,
  dependencies: BackendVoiceConsentDependencies
) {
  return Effect.gen(function* () {
    const existing = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect.mapError(
        () =>
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "consent_unavailable",
            message: "Failed to retrieve voice training consent state for revocation"
          })
      )
    );

    const timestamp = dependencies.now().toISOString();
    const resourceId = existing?.id ?? buildVoiceConsentResourceId(userId);
    const baseConsentRecord = {
      id: resourceId,
      userId,
      grantedAt: existing?.grantedAt,
      evidenceBoundary: "consent" as const,
      createdAt: existing?.createdAt ?? timestamp
    };

    yield* persistRevocationPendingConsent({
      ...baseConsentRecord,
      updatedAt: timestamp
    }, dependencies).pipe(
      Effect.mapError(() =>
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to persist pending voice training consent revocation"
        })
      )
    );

    const cleanupResult = yield* removeProtectedVoiceArtifacts(userId, dependencies.database).pipe(
      Effect.catchAll((error) =>
        recordBlockedRevocation({
          userId,
          resourceId,
          occurredAt: timestamp,
          previousGrantedAt: existing?.grantedAt,
          reason: error.message,
          policyEvidence: dependencies.policyEvidence,
          database: dependencies.database
        }).pipe(Effect.zipRight(Effect.fail(error)))
      )
    );

    yield* dependencies.database.voiceTrainingConsents.put({
      ...baseConsentRecord,
      granted: false,
      revokedAt: timestamp,
      updatedAt: timestamp
    }).pipe(
      Effect.mapError(
        () =>
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "protection_failed",
            message: "Failed to persist completed voice training consent revocation"
          })
      )
    );

    yield* persistBackendAuditEvent(dependencies.database, {
      logicalKey: `voice-consent:${userId}:revoked:${timestamp}`,
      actorId: userId,
      actorType: "application_user",
      resourceType: "voice_training_consent",
      resourceId,
      mutationType: "voice_training_consent.revoked",
      occurredAt: timestamp,
      metadata: {
        previousGrantedAt: existing?.grantedAt ?? null,
        revokedAt: timestamp,
        ...cleanupResult
      }
    }).pipe(Effect.orDie);

    if (dependencies.policyEvidence) {
      yield* dependencies.policyEvidence.recordConsentEvidence({
        actorId: userId,
        actorType: "application_user",
        resourceId,
        outcome: "revoked",
        consentAction: "revoke",
        occurredAt: timestamp
      }).pipe(Effect.orElse(swallowWithDiagnostic({
        operation: "Failed to persist consent revocation evidence",
        context: { userId, resourceId }
      })));
    }
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: error instanceof Error ? error.message : "Unexpected consent revocation failure"
        })
      )
    )
  );
}

function persistRevocationPendingConsent(
  args: {
    readonly id: string;
    readonly userId: string;
    readonly grantedAt?: string;
    readonly evidenceBoundary: "consent";
    readonly createdAt: string;
    readonly updatedAt: string;
  },
  dependencies: Pick<BackendVoiceConsentDependencies, "database">
) {
  return dependencies.database.voiceTrainingConsents.put({
    id: args.id,
    userId: args.userId,
    granted: false,
    grantedAt: args.grantedAt,
    revokedAt: undefined,
    evidenceBoundary: args.evidenceBoundary,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt
  });
}

// exported for reuse by account reset/delete (contract-08) — same voice-artifact purge primitive.
export function removeProtectedVoiceArtifacts(
  userId: string,
  database: BackendVoiceConsentDependencies["database"]
) {
  return Effect.gen(function* () {
    const removedExamples = yield* database.voiceExamples.removeByUser(userId).pipe(
      Effect.mapError(() =>
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove stored voice examples during consent revocation"
        })
      )
    );
    const profileRemoved = yield* database.voiceProfiles.removeByUser(userId).pipe(
      Effect.mapError(() =>
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove derived voice profile during consent revocation"
        })
      )
    );
    const diagnosticsRemoved = yield* database.voiceProfileDiagnostics.removeByUser(userId).pipe(
      Effect.mapError(() =>
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove voice profile diagnostics during consent revocation"
        })
      )
    );
    const removedSnapshots = yield* database.voiceProfileSnapshots.removeByUser(userId).pipe(
      Effect.mapError(() =>
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove voice profile snapshots during consent revocation"
        })
      )
    );
    // contract-08 — voice_example_batches is part of the same voice-artifact family; closing this
    // gap here (root cause) means account reset/delete gets it for free by reusing this function.
    const removedBatches = yield* database.voiceExampleBatches.removeByUser(userId).pipe(
      Effect.mapError(() =>
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Failed to remove voice example batches during consent revocation"
        })
      )
    );

    return {
      removedExamples,
      profileRemoved,
      diagnosticsRemoved,
      removedSnapshots,
      removedBatches
    };
  });
}

function recordBlockedRevocation(args: {
  readonly userId: string;
  readonly resourceId: string;
  readonly occurredAt: string;
  readonly previousGrantedAt?: string;
  readonly reason: string;
  readonly policyEvidence?: BackendPolicyEvidenceService;
  readonly database: BackendVoiceConsentDependencies["database"];
}) {
  const audit = persistBackendAuditEvent(args.database, {
    logicalKey: `voice-consent:${args.userId}:revocation-blocked:${args.occurredAt}`,
    actorId: args.userId,
    actorType: "application_user",
    resourceType: "voice_training_consent",
    resourceId: args.resourceId,
    mutationType: "voice_training_consent.revocation_blocked",
    occurredAt: args.occurredAt,
    metadata: {
      previousGrantedAt: args.previousGrantedAt ?? null,
      revocationPendingAt: args.occurredAt,
      reason: args.reason
    }
  }).pipe(Effect.orDie);

  const evidence = args.policyEvidence
    ? args.policyEvidence.recordConsentEvidence({
        actorId: args.userId,
        actorType: "application_user",
        resourceId: args.resourceId,
        outcome: "block",
        consentAction: "revoke",
        occurredAt: args.occurredAt
      }).pipe(Effect.orElse(swallowWithDiagnostic({
        operation: "Failed to persist blocked consent revocation evidence",
        context: {
          userId: args.userId,
          resourceId: args.resourceId
        }
      })))
    : Effect.void;

  return Effect.zipRight(audit, evidence);
}
