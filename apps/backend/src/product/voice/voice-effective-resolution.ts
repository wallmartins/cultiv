import { Effect } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { VoiceProfileSnapshot } from "@my-ai-orchestrator/domain";
import type { BackendConfig } from "../../config/config.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { EffectiveVoiceContext, EffectiveVoiceResolution } from "./voice-types.js";
import {
  buildEffectiveVoiceMetadata,
  buildVoiceProfileSnapshotId,
  resolveAdaptationMode,
  resolveFallbackReasonCode
} from "./voice-resolution-helpers.js";
import { buildVoiceHints, selectExamplesForContentType } from "./voice-hints.js";
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
): Effect.Effect<EffectiveVoiceResolution | undefined> {
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
    const matchingExamples = selectExamplesForContentType(activeExamples, context.contentType);
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
        contentType: context.contentType,
        environment: options?.config?.environment
      }) ?? false;
    const voiceHints = buildVoiceHints(
      profile,
      matchingExamples,
      pinnedMatchingExamples,
      context,
      confidence,
      adaptationMode,
      undefined,
      { reasoningSignatureEnabled }
    );
    const snapshotId = buildVoiceProfileSnapshotId(userId, profile.version, context.contentType, now());
    const metadata = buildEffectiveVoiceMetadata({
      profile: {
        profileVersion: profile.version,
        snapshotId: profile.snapshotId,
        confidence: profile.confidence,
        adaptationMode: profile.adaptationMode,
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
      contentType: context.contentType,
      confidence,
      adaptationMode,
      appliedSignals: {
        styleMarkers: voiceHints.styleMarkers ?? [],
        rules: voiceHints.rules ?? [],
        antiPatterns: voiceHints.antiPatterns ?? [],
        ...(reasoningSignatureEnabled && voiceHints.coreReasoningSignature
          ? {
              reasoningApplied: true,
              certaintyLevel: voiceHints.coreReasoningSignature.certaintyLevel,
              conclusionPace: voiceHints.coreReasoningSignature.conclusionPace
            }
          : {})
      },
      resolutionContext: {
        contentType: context.contentType,
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
      contentType: context.contentType,
      requestedLanguage: context.requestedLanguage,
      voiceProfileVersionUsed: profile.version
    });
    logger?.info("Persisted execution voice snapshot", {
      userId,
      snapshotId,
      contentType: context.contentType,
      requestedLanguage: context.requestedLanguage
    });

    return {
      voiceHints,
      metadata
    } satisfies EffectiveVoiceResolution;
  });
}
