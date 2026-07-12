import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { BackendConfig } from "../../config/config.js";
import type { BackendVoiceService } from "./voice-types.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import { resolveEffectiveVoice as resolveEffectiveVoiceResolution } from "./voice-effective-resolution.js";
import { recordTraitConfirmation } from "./trait-confirmation.js";
import { toVoiceProfileScreenView } from "./voice-mappers.js";

export function createBackendVoiceService(
  database: DatabaseClient,
  _voiceRebuild: BackendVoiceRebuildService,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService,
  options?: {
    readonly featureFlags?: FeatureFlagServiceContract;
    readonly config?: BackendConfig;
  }
): BackendVoiceService {
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
          diagnostics,
          {
            includeReasoning:
              options?.featureFlags?.isEnabled("voice.reasoningSignatureV1", {
                userId,
                environment: options?.config?.environment
              }) ?? false
          }
        );
      });
    },
    recordTraitConfirmation(userId, input) {
      return recordTraitConfirmation(database, userId, input, now, observability);
    },
    resolveEffectiveVoice(userId, context) {
      return resolveEffectiveVoiceResolution(
        database,
        userId,
        context,
        now,
        observability,
        logger,
        voiceConsent,
        options
      );
    }
  };
}
