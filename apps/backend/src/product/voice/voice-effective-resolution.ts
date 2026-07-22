import { Effect } from "effect";
import type { DatabaseClient, DatabaseError } from "@my-ai-orchestrator/database";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { VoiceProfileSnapshot } from "@my-ai-orchestrator/domain";
import type { BackendConfig } from "../../config/config.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { EffectiveVoiceContext, EffectiveVoiceResolution } from "./voice-types.js";
import {
  buildAppliedSignals,
  buildEffectiveVoiceMetadata,
  buildVoiceProfileSnapshotId,
  resolveAdaptationMode,
  resolveFallbackReasonCode
} from "./voice-resolution-helpers.js";
import { buildVoiceHints, selectExamplesForChannel } from "./voice-hints.js";
import { toVoiceProfileDomain } from "@my-ai-orchestrator/database";

export function resolveEffectiveVoice(
  database: DatabaseClient,
  userId: string,
  context: EffectiveVoiceContext,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: import("@my-ai-orchestrator/core").AppLogger,
  voiceConsent?: BackendVoiceConsentService,
  options?: {
    readonly featureFlags?: FeatureFlagServiceContract;
    readonly config?: BackendConfig;
  }
): Effect.Effect<EffectiveVoiceResolution | undefined, DatabaseError> {
  return Effect.gen(function* () {
    if (voiceConsent) {
      const consentStatus = yield* voiceConsent.getConsentStatus(userId).pipe(
        Effect.orElseSucceed(() => ({ granted: false, revokedAt: undefined }))
      );
      if (!consentStatus.granted || consentStatus.revokedAt !== undefined) {
        return undefined;
      }
    }

    const profileRecord = yield* database.voiceProfiles.getByUser(userId);
    const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);

    if (!profileRecord || !diagnostics) {
      return undefined;
    }

    const profile = toVoiceProfileDomain(profileRecord);
    const examples = yield* database.voiceExamples.listByUser(userId);
    const activeExamples = examples.filter((example) => example.state === "active");
    const matchingExamples = selectExamplesForChannel(activeExamples, context.channel);
    const pinnedMatchingExamples = matchingExamples.filter((example) => example.pinned);
    const fallbackReasonCode = resolveFallbackReasonCode(diagnostics.pendingRebuild.status);
    const usedFallbackVoiceProfile = fallbackReasonCode !== undefined;
    const confidence = profile.confidence;
    const adaptationMode = resolveAdaptationMode(
      confidence,
      usedFallbackVoiceProfile,
      context.requestedLanguage,
      profile.primaryLanguage
    );
    const reasoningSignatureEnabled =
      options?.featureFlags?.isEnabled("voice.reasoningSignatureV1", {
        userId,
        environment: options?.config?.environment
      }) ?? false;
    const voiceHints = buildVoiceHints(
      profile,
      matchingExamples,
      pinnedMatchingExamples,
      context,
      confidence,
      adaptationMode,
      { reasoningSignatureEnabled }
    );
    const snapshotId = buildVoiceProfileSnapshotId(userId, profile.version, context.channel, now());
    const metadata = buildEffectiveVoiceMetadata({
      profile: {
        profileVersion: profile.version,
        snapshotId: profile.snapshotId,
        confidence: profile.confidence,
        primaryLanguage: profile.primaryLanguage
      },
      diagnostics,
      context,
      confidence,
      adaptationMode,
      fallbackReasonCode,
      usedFallbackVoiceProfile,
      voiceHints,
      snapshotId
    });
    yield* database.voiceProfileSnapshots.create({
      id: snapshotId,
      userId,
      sourceProfileId: profile.id,
      sourceProfileVersion: profile.version,
      channel: context.channel,
      confidence,
      adaptationMode,
      appliedSignals: buildAppliedSignals(voiceHints),
      resolutionContext: {
        channel: context.channel,
        requestedLanguage: context.requestedLanguage,
        voiceProfileConfidence: confidence,
        voiceAdaptationMode: adaptationMode,
        usedFallbackVoiceProfile,
        reasoningSignatureEnabled
      },
      createdAt: now().toISOString()
    } satisfies VoiceProfileSnapshot).pipe(Effect.orDie);
    yield* observability.recordVoiceSnapshotPersisted({
      userId,
      snapshotId,
      channel: context.channel,
      requestedLanguage: context.requestedLanguage,
      voiceProfileVersionUsed: profile.version
    });
    logger?.info("Persisted execution voice snapshot", {
      userId,
      snapshotId,
      channel: context.channel,
      requestedLanguage: context.requestedLanguage
    });

    return {
      voiceHints,
      metadata
    } satisfies EffectiveVoiceResolution;
  });
}
