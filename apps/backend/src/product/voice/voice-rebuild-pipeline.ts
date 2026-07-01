import { Effect, Either } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import { toVoiceProfileDomain } from "@my-ai-orchestrator/database";
import type { BackendConfig } from "../../config/config.js";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import {
  deriveVoiceRebuildState,
  resolveNextProfileVersion
} from "./voice-rebuild-derivation.js";
import { extractReasoningSignature } from "./reasoning-extraction.js";
import { extractArgumentDevelopmentSignature } from "./argument-development-extraction.js";
import { evaluateVoiceSignatureDivergence } from "./voice-signature-divergence.js";
import { reconcileVoiceSignatures } from "./voice-signature-reconciliation.js";
import { buildQuantitativeSignalsFromWizardExamples } from "./deterministic-extraction.js";
import { extractSignaturePhrases, resolveReasoningOutputLanguage } from "./reasoning-extraction.js";
import { isWizardVoiceExample } from "./wizard-voice-examples.js";
import {
  buildVoiceSignatureBrief,
  synthesizeDevelopmentFromBrief,
  synthesizeReasoningExtractionFromBrief
} from "./voice-signature-brief.js";
import type {
  ArgumentDevelopmentExtractionResult,
  ArgumentDevelopmentSignature,
  QuantitativeSignals,
  ReasoningExtractionResult
} from "@my-ai-orchestrator/contracts";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import {
  attachTraitProfileToDevelopment,
  clearProfileImpactFlags,
  markRebuildFailure,
  markRebuildQueued
} from "./voice-rebuild-pipeline-diagnostics.js";

export interface BackendVoiceRebuildDependencies {
  readonly aiAdapters?: AIAdapterServiceContract;
  readonly providerTransport?: BackendProviderTransport;
  readonly featureFlags?: FeatureFlagServiceContract;
  readonly aiPolicy?: BackendAIPolicyServiceContract;
  readonly config?: BackendConfig;
}

export interface VoiceRebuildPipelineDeps {
  readonly database: DatabaseClient;
  readonly now: () => Date;
  readonly observability: BackendObservabilityService;
  readonly logger?: AppLogger;
  readonly voiceConsent?: BackendVoiceConsentService;
  readonly dependencies?: BackendVoiceRebuildDependencies;
}

export function createVoiceRebuildPipelineHandlers(deps: VoiceRebuildPipelineDeps) {
  return {
    processUserRebuild: (userId: string) => processUserRebuild(deps, userId),
    markRebuildQueued: (userId: string) => markRebuildQueued(deps.database, userId, deps.now)
  };
}

function processUserRebuild(deps: VoiceRebuildPipelineDeps, userId: string) {
  const { database, now, observability, logger, voiceConsent, dependencies = {} } = deps;

  return Effect.gen(function* () {
    if (voiceConsent) {
      const consentStatus = yield* voiceConsent.getConsentStatus(userId).pipe(
        Effect.orElseSucceed(() => ({ granted: false, revokedAt: undefined }))
      );
      if (!consentStatus.granted || consentStatus.revokedAt !== undefined) {
        logger?.info("Skipped voice profile rebuild because voice training consent is not active", { userId });
        yield* observability.recordVoiceRebuildFailed({
          userId,
          reason: "consent_revoked"
        });
        return;
      }
    }

    const timestamp = now().toISOString();
    const currentProfile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const allExamples = yield* database.voiceExamples.listByUser(userId);
    yield* observability.recordVoiceRebuildStarted({
      userId,
      startedAt: timestamp
    });
    const nextVersion = resolveNextProfileVersion(currentProfile, currentDiagnostics);
    const previousProfile = currentProfile ? toVoiceProfileDomain(currentProfile) : undefined;
    const reasoningEnabled =
      dependencies.featureFlags?.isEnabled("voice.reasoningSignatureV1", {
        userId,
        environment: dependencies.config?.environment
      }) ?? false;

    let reasoning: ReasoningExtractionResult | undefined;
    let development: ArgumentDevelopmentSignature | undefined;
    let reasoningExtractionFailed = false;
    let developmentExtractionFailed = false;
    let reconciliationFailed = false;

    const activeExamples = allExamples.filter((example) => example.state === "active");
    const wizardExamples = activeExamples.filter(isWizardVoiceExample);
    const signatureBrief =
      wizardExamples.length > 0 ? buildVoiceSignatureBrief(wizardExamples) : undefined;

    if (
      reasoningEnabled
      && dependencies.aiAdapters
      && dependencies.providerTransport
      && dependencies.aiPolicy
    ) {
      const policy = yield* dependencies.aiPolicy.getActivePolicy();
      const routingProfile = policy.routingProfiles["voice-extraction-llm"];
      const attempts = routingProfile
        ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts]
        : [];

      if (attempts.length > 0) {
        const reasoningEffect = extractReasoningSignature({
          examples: allExamples,
          attempts,
          aiAdapters: dependencies.aiAdapters,
          providerTransport: dependencies.providerTransport,
          brief: signatureBrief
        }).pipe(Effect.either);

        const developmentEffect =
          activeExamples.length >= 2
            ? extractArgumentDevelopmentSignature({
                examples: allExamples,
                attempts,
                aiAdapters: dependencies.aiAdapters,
                providerTransport: dependencies.providerTransport,
                brief: signatureBrief
              }).pipe(Effect.either)
            : Effect.succeed(
                Either.right<ArgumentDevelopmentExtractionResult | undefined>(undefined)
              );

        const [reasoningResult, developmentResult] = yield* Effect.all([
          reasoningEffect,
          developmentEffect
        ]);

        if (reasoningResult._tag === "Right") {
          reasoning = reasoningResult.right;
          logger?.info("Reasoning extraction succeeded", {
            userId,
            formatExpressionCount: Object.keys(reasoningResult.right.formatExpressions).length
          });
        } else {
          reasoningExtractionFailed = true;
          logger?.warn("Reasoning extraction failed; keeping previous reasoning snapshot", {
            userId,
            reason: reasoningResult.left.message
          });
          yield* observability.recordVoiceReasoningExtractionFailed({
            userId,
            reason: reasoningResult.left.message
          });
        }

        if (activeExamples.length >= 2) {
          if (developmentResult._tag === "Right" && developmentResult.right !== undefined) {
            const attached = attachTraitProfileToDevelopment({
              extraction: developmentResult.right,
              activeExamples,
              previousDevelopment: previousProfile?.argumentDevelopmentSignature
            });
            development = attached.development;
            if (attached.confidenceMetrics) {
              yield* observability.recordTraitConfidenceComputed({
                userId,
                ...attached.confidenceMetrics
              });
            }
            logger?.info("Argument development extraction succeeded", {
              userId,
              epistemicPosture: development.epistemicPosture,
              traitCount: development.traitProfile
                ? Object.keys(development.traitProfile.records).length
                : 0
            });
          } else if (developmentResult._tag === "Left") {
            developmentExtractionFailed = true;
            logger?.warn("Argument development extraction failed; keeping previous development snapshot", {
              userId,
              reason: developmentResult.left.message
            });
            yield* observability.recordVoiceDevelopmentExtractionFailed({
              userId,
              reason: developmentResult.left.message
            });
          }
        }

        if (
          reasoning
          && development
          && !reasoningExtractionFailed
          && !developmentExtractionFailed
        ) {
          const divergence = evaluateVoiceSignatureDivergence({
            reasoning,
            development,
            traitProfile: development.traitProfile
          });
          if (divergence.hasConflict) {
            const reconciled = yield* reconcileVoiceSignatures({
              examples: allExamples,
              reasoning,
              development,
              attempts,
              aiAdapters: dependencies.aiAdapters,
              providerTransport: dependencies.providerTransport
            }).pipe(Effect.either);

            if (reconciled._tag === "Right") {
              reasoning = {
                core: reconciled.right.core,
                formatExpressions: reconciled.right.formatExpressions
              };
              development = reconciled.right.development;
              yield* observability.recordVoiceSignatureReconciliationInvoked({
                userId,
                reasons: divergence.reasons
              });
            } else {
              reconciliationFailed = true;
              reasoning = undefined;
              development = undefined;
              logger?.warn("Voice signature reconciliation failed; keeping previous profile snapshots", {
                userId,
                reason: reconciled.left.message
              });
              yield* observability.recordVoiceSignatureReconciliationFailed({
                userId,
                reason: reconciled.left.message,
                reasons: divergence.reasons
              });
            }
          } else {
            yield* observability.recordVoiceSignatureReconciliationSkipped({
              userId
            });
          }
        }
      } else if (attempts.length === 0) {
        reasoningExtractionFailed = true;
        logger?.warn("Reasoning extraction skipped; voice-extraction-llm routing profile has no attempts", {
          userId
        });
      }
    }

    if (signatureBrief) {
      const outputLanguage = resolveReasoningOutputLanguage(allExamples);

      if (!reasoning) {
        reasoning = synthesizeReasoningExtractionFromBrief(signatureBrief, outputLanguage);
        reasoningExtractionFailed = false;
        logger?.info("Used deterministic reasoning fallback from signature brief", { userId });
      }

      if (!development && activeExamples.length >= 2) {
        development = synthesizeDevelopmentFromBrief(signatureBrief, outputLanguage);
        developmentExtractionFailed = false;
        logger?.info("Used deterministic development fallback from signature brief", { userId });
      }
    }

    let quantitativeSignals: QuantitativeSignals | undefined;
    let signatureOpenings: readonly string[] | undefined;
    let signatureClosings: readonly string[] | undefined;

    const wizardExamplesForSignals = activeExamples.filter(isWizardVoiceExample);
    if (wizardExamplesForSignals.length > 0) {
      try {
        quantitativeSignals = buildQuantitativeSignalsFromWizardExamples(wizardExamplesForSignals, {
          reasoningExtracted: reasoning !== undefined && !reasoningExtractionFailed,
          developmentExtracted: development !== undefined && !developmentExtractionFailed,
          reconciliationNeeded: reconciliationFailed
        });
        const phrases = extractSignaturePhrases(wizardExamplesForSignals.map((example) => example.text));
        signatureOpenings = phrases.signatureOpenings;
        signatureClosings = phrases.signatureClosings;
      } catch {
        // ponytail: deterministic extraction is optional; rebuild continues without signals
      }
    }

    const derivedState = deriveVoiceRebuildState({
      userId,
      version: nextVersion,
      timestamp,
      allExamples,
      previousProfile,
      reasoning,
      development,
      reasoningExtractionFailed,
      developmentExtractionFailed,
      reconciliationFailed,
      quantitativeSignals,
      signatureOpenings,
      signatureClosings
    });

    yield* database.voiceProfiles.put(derivedState.profile).pipe(Effect.orDie);
    yield* database.voiceProfileDiagnostics.put(derivedState.diagnostics).pipe(Effect.orDie);
    yield* observability.recordVoiceRefreshEvent({
      userId,
      version: derivedState.profile.version,
      snapshotId: derivedState.profile.snapshotId
    });
    logger?.info("Refreshed voice profile snapshot", {
      userId,
      version: derivedState.profile.version,
      snapshotId: derivedState.profile.snapshotId
    });
    yield* clearProfileImpactFlags(database, allExamples, nextVersion, timestamp);
    yield* observability.recordVoiceRebuildCompleted({
      userId,
      version: derivedState.profile.version,
      snapshotId: derivedState.profile.snapshotId
    });
  }).pipe(
    Effect.catchAllCause((cause) =>
      markRebuildFailure(database, userId, now, cause).pipe(
        Effect.tap(() =>
          observability.recordVoiceRebuildFailed({
            userId,
            reason: "processing_failed"
          })
        ),
        Effect.tap(() =>
          Effect.sync(() =>
            logger?.error("Voice profile rebuild failed", {
              userId,
              reason: "processing_failed"
            })
          )
        ),
        Effect.orDie
      )
    )
  );
}
