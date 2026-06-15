import { Effect } from "effect";
import { BackendVoiceTrainingConsentFailureError } from "../http/errors.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import type { BackendVoiceConsentDependencies } from "./voice-consent-shared.js";
import {
  buildVoiceConsentResourceId,
  isRevocationPending
} from "./voice-consent-shared.js";

export function grantVoiceTrainingConsent(
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
            message: "Failed to retrieve voice training consent state before grant"
          })
      )
    );
    if (isRevocationPending(existing)) {
      return yield* Effect.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: "Voice training consent cannot be granted again until prior revocation cleanup completes"
        })
      );
    }

    const timestamp = dependencies.now().toISOString();
    const resourceId = buildVoiceConsentResourceId(userId);
    yield* dependencies.database.voiceTrainingConsents.put({
      id: existing?.id ?? resourceId,
      userId,
      granted: true,
      grantedAt: timestamp,
      evidenceBoundary: "consent",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    }).pipe(
      Effect.mapError(
        () =>
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "protection_failed",
            message: "Failed to persist voice training consent grant"
          })
      )
    );

    if (dependencies.policyEvidence) {
      yield* dependencies.policyEvidence.recordConsentEvidence({
        actorId: userId,
        actorType: "application_user",
        resourceId,
        outcome: "granted",
        consentAction: "grant",
        occurredAt: timestamp
      }).pipe(Effect.orElse(swallowWithDiagnostic({
        operation: "Failed to persist consent grant evidence",
        context: { userId, resourceId }
      })));
    }
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "protection_failed",
          message: error instanceof Error ? error.message : "Unexpected consent grant failure"
        })
      )
    )
  );
}
