import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BackendVoiceService } from "./voice-types.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import { createVoiceBatchOperations } from "./voice-batches.js";
import { createVoiceLifecycleOperations } from "./voice-lifecycle.js";
import { resolveEffectiveVoice as resolveEffectiveVoiceResolution } from "./voice-effective-resolution.js";
import { toVoiceProfileScreenView } from "./voice-mappers.js";

export function createBackendVoiceService(
  database: DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService
): BackendVoiceService {
  const lifecycle = createVoiceLifecycleOperations(database, voiceRebuild, now, logger, voiceConsent);
  const batches = createVoiceBatchOperations(database, voiceRebuild, now, observability, logger, voiceConsent);

  return {
    getProfileScreen(userId) {
      return Effect.gen(function* () {
        if (voiceConsent) {
          const consentStatus = yield* voiceConsent.getConsentStatus(userId).pipe(
            Effect.orElseSucceed(() => ({ granted: false, revokedAt: undefined }))
          );
          if (!consentStatus.granted || consentStatus.revokedAt !== undefined) {
            return undefined;
          }
        }

        const profile = yield* database.voiceProfiles.getByUser(userId);
        const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);

        if (!profile || !diagnostics) {
          return undefined;
        }

        return toVoiceProfileScreenView(
          {
            ...profile,
            version: profile.profileVersion
          },
          diagnostics
        );
      });
    },
    resolveEffectiveVoice(userId, context) {
      return resolveEffectiveVoiceResolution(database, userId, context, now, observability, logger, voiceConsent);
    },
    ...lifecycle,
    ...batches
  };
}
