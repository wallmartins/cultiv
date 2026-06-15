import { Effect } from "effect";
import {
  BackendVoiceTrainingConsentFailureError,
  BackendVoiceTrainingConsentRequiredError
} from "../http/errors.js";
import { swallowWithDiagnostic } from "../effects/non-blocking-diagnostics.js";
import type { BackendVoiceConsentDependencies } from "./voice-consent-shared.js";
import { buildVoiceConsentResourceId } from "./voice-consent-shared.js";

export function assertVoiceTrainingConsent(
  userId: string,
  dependencies: BackendVoiceConsentDependencies
) {
  return Effect.gen(function* () {
    const timestamp = dependencies.now().toISOString();
    const consent = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect.mapError(
        () =>
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "consent_unavailable",
            message: "Failed to retrieve voice training consent state"
          })
      ),
      Effect.catchAllDefect(() =>
        Effect.fail(
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "consent_unavailable",
            message: "Consent repository failed unexpectedly"
          })
        )
      )
    );

    if (!consent || !consent.granted || consent.revokedAt !== undefined) {
      if (dependencies.policyEvidence) {
        const resourceId = consent?.id ?? buildVoiceConsentResourceId(userId);
        yield* dependencies.policyEvidence.recordConsentEvidence({
          actorId: userId,
          actorType: "application_user",
          resourceId,
          outcome: "block",
          consentAction: "assert",
          occurredAt: timestamp
        }).pipe(Effect.orElse(swallowWithDiagnostic({
          operation: "Failed to persist blocked consent assertion evidence",
          context: { userId, resourceId }
        })));
      }

      return yield* Effect.fail(
        new BackendVoiceTrainingConsentRequiredError({
          userId,
          message: "Voice training consent is required before voice examples can be stored or used"
        })
      );
    }
  });
}

export function getVoiceTrainingConsentStatus(
  userId: string,
  dependencies: BackendVoiceConsentDependencies
) {
  return Effect.gen(function* () {
    const consent = yield* dependencies.database.voiceTrainingConsents.getByUser(userId).pipe(
      Effect.mapError(
        () =>
          new BackendVoiceTrainingConsentFailureError({
            userId,
            reason: "consent_unavailable",
            message: "Failed to retrieve voice training consent state"
          })
      )
    );

    return {
      granted: consent?.granted ?? false,
      grantedAt: consent?.grantedAt,
      revokedAt: consent?.revokedAt
    };
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new BackendVoiceTrainingConsentFailureError({
          userId,
          reason: "consent_unavailable",
          message: error instanceof Error ? error.message : "Unexpected consent status failure"
        })
      )
    )
  );
}
