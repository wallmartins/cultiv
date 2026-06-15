import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { VoiceProfileSnapshot } from "@my-ai-orchestrator/domain";
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

export function resolveEffectiveVoice(
  database: DatabaseClient,
  userId: string,
  context: EffectiveVoiceContext,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService
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

    const profile = yield* database.voiceProfiles.getByUser(userId);
    const diagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);

    if (!profile || !diagnostics) {
      return undefined;
    }

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
    const voiceHints = buildVoiceHints(profile, matchingExamples, pinnedMatchingExamples, context, confidence, adaptationMode);
    const snapshotId = buildVoiceProfileSnapshotId(userId, profile.profileVersion, context.contentType, now());
    const metadata = buildEffectiveVoiceMetadata({
      profile,
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
      sourceProfileVersion: profile.profileVersion,
      contentType: context.contentType,
      confidence,
      adaptationMode,
      appliedSignals: {
        styleMarkers: voiceHints.styleMarkers ?? [],
        rules: voiceHints.rules ?? [],
        antiPatterns: voiceHints.antiPatterns ?? []
      },
      resolutionContext: {
        contentType: context.contentType,
        requestedLanguage: context.requestedLanguage,
        voiceProfileConfidence: confidence,
        voiceAdaptationMode: adaptationMode,
        usedFallbackVoiceProfile
      },
      createdAt: now().toISOString()
    } satisfies VoiceProfileSnapshot).pipe(Effect.orDie);
    yield* observability.recordVoiceSnapshotPersisted({
      userId,
      snapshotId,
      contentType: context.contentType,
      requestedLanguage: context.requestedLanguage,
      voiceProfileVersionUsed: profile.profileVersion
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
