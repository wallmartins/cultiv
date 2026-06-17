import { Effect, Either } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { DatabaseClient, VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import { toVoiceProfileDomain } from "@my-ai-orchestrator/database";
import {
  nextActionCodesForReason,
  type VoiceProfileDiagnostics
} from "@my-ai-orchestrator/domain";
import type { BackendConfig } from "../../config/config.js";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import {
  buildVoiceMaterialBase,
  deriveVoiceRebuildState,
  resolveNextProfileVersion
} from "./voice-rebuild-derivation.js";
import { extractReasoningSignature } from "./reasoning-extraction.js";
import { extractArgumentDevelopmentSignature } from "./argument-development-extraction.js";
import { evaluateVoiceSignatureDivergence } from "./voice-signature-divergence.js";
import { reconcileVoiceSignatures } from "./voice-signature-reconciliation.js";
import type {
  ArgumentDevelopmentExtractionResult,
  ArgumentDevelopmentSignature,
  ReasoningExtractionResult
} from "@my-ai-orchestrator/contracts";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";

interface RebuildQueueState {
  running: boolean;
  queued: boolean;
  activePromise?: Promise<void>;
}

export interface BackendVoiceRebuildDependencies {
  readonly aiAdapters?: AIAdapterServiceContract;
  readonly providerTransport?: BackendProviderTransport;
  readonly featureFlags?: FeatureFlagServiceContract;
  readonly aiPolicy?: BackendAIPolicyServiceContract;
  readonly config?: BackendConfig;
}

export function createBackendVoiceRebuildService(
  database: DatabaseClient,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService,
  dependencies: BackendVoiceRebuildDependencies = {}
): BackendVoiceRebuildService {
  const states = new Map<string, RebuildQueueState>();

  const ensureState = (userId: string): RebuildQueueState => {
    const existing = states.get(userId);
    if (existing) {
      return existing;
    }

    const created: RebuildQueueState = {
      running: false,
      queued: false
    };
    states.set(userId, created);
    return created;
  };

  const startRunner = (userId: string, state: RebuildQueueState): void => {
    if (state.running) {
      return;
    }

    state.running = true;
    state.activePromise = (async () => {
      try {
        while (state.queued) {
          state.queued = false;
          await Effect.runPromise(
            processUserRebuild(database, userId, now, observability, logger, voiceConsent, dependencies)
          );

          if (state.queued) {
            await Effect.runPromise(markRebuildQueued(database, userId, now));
          }
        }
      } finally {
        state.running = false;
        state.activePromise = undefined;

        if (state.queued) {
          startRunner(userId, state);
        }
      }
    })().catch((error: unknown) => {
        logger?.error("Voice profile rebuild runner failed", {
          userId,
          reason: error instanceof Error ? error.message : "unknown_error"
        });
      });
  };

  const waitForIdle = async (userId?: string): Promise<void> => {
    while (true) {
      const relevantStates = userId ? [ensureState(userId)] : [...states.values()];
      const activePromises = relevantStates
        .map((state) => state.activePromise)
        .filter((promise): promise is Promise<void> => promise !== undefined);
      const stillBusy = relevantStates.some((state) => state.running || state.queued);

      if (!stillBusy) {
        return;
      }

      if (activePromises.length === 0) {
        await Promise.resolve();
        continue;
      }

      await Promise.all(activePromises);
    }
  };

  return {
    schedule(userId) {
      return Effect.sync(() => {
        const state = ensureState(userId);
        state.queued = true;

        Effect.runSync(
          observability.recordVoiceRebuildQueued({
            userId,
            queuedAt: now().toISOString()
          })
        );
        logger?.info("Queued voice profile rebuild", {
          userId
        });

        void Effect.runPromise(markRebuildQueued(database, userId, now)).catch(() => undefined);
        startRunner(userId, state);
      });
    },
    drain(userId) {
      return Effect.promise(() => waitForIdle(userId));
    }
  };
}

function processUserRebuild(
  database: DatabaseClient,
  userId: string,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService,
  dependencies: BackendVoiceRebuildDependencies = {}
) {
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
          providerTransport: dependencies.providerTransport
        }).pipe(Effect.either);

        const developmentEffect =
          activeExamples.length >= 2
            ? extractArgumentDevelopmentSignature({
                examples: allExamples,
                attempts,
                aiAdapters: dependencies.aiAdapters,
                providerTransport: dependencies.providerTransport
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
            development = developmentResult.right.development;
            logger?.info("Argument development extraction succeeded", {
              userId,
              epistemicPosture: developmentResult.right.development.epistemicPosture
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
          const divergence = evaluateVoiceSignatureDivergence({ reasoning, development });
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
      reconciliationFailed
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

function markRebuildQueued(
  database: DatabaseClient,
  userId: string,
  now: () => Date
) {
  return Effect.gen(function* () {
    const timestamp = now().toISOString();
    const profile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const nextVersion = resolveNextProfileVersion(profile, currentDiagnostics);

    const diagnostics: VoiceProfileDiagnostics = {
      id: currentDiagnostics?.id ?? `voice-diagnostics:${userId}`,
      userId,
      activeVersion: currentDiagnostics?.activeVersion ?? profile?.profileVersion ?? 0,
      pendingVersion: nextVersion,
      updating: true,
      summary: currentDiagnostics?.summary ?? "Atualizando o profile de voz com os exemplos mais recentes.",
      reasonCodes: currentDiagnostics?.reasonCodes ?? [],
      nextActionCodes: currentDiagnostics?.nextActionCodes ?? [],
      bestCoveredContentTypes: currentDiagnostics?.bestCoveredContentTypes ?? [],
      underrepresentedContentTypes: currentDiagnostics?.underrepresentedContentTypes ?? [],
      pendingRebuild: {
        status: "in_progress",
        reasonCode: "rebuild_in_progress",
        nextActionCodes: nextActionCodesForReason("rebuild_in_progress")
      },
      materialBase:
        currentDiagnostics?.materialBase ??
        buildVoiceMaterialBase(yield* database.voiceExamples.listByUser(userId)),
      createdAt: currentDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect.orDie);
  });
}

function markRebuildFailure(
  database: DatabaseClient,
  userId: string,
  now: () => Date,
  _cause: unknown
) {
  return Effect.gen(function* () {
    const timestamp = now().toISOString();
    const profile = yield* database.voiceProfiles.getByUser(userId);
    const currentDiagnostics = yield* database.voiceProfileDiagnostics.getByUser(userId);
    const examples = yield* database.voiceExamples.listByUser(userId);
    const materialBase = buildVoiceMaterialBase(examples);

    const diagnostics: VoiceProfileDiagnostics = {
      id: currentDiagnostics?.id ?? `voice-diagnostics:${userId}`,
      userId,
      activeVersion: currentDiagnostics?.activeVersion ?? profile?.profileVersion ?? 0,
      updating: false,
      summary: "Não foi possível atualizar o profile agora. O último profile válido continua ativo.",
      reasonCodes: currentDiagnostics?.reasonCodes ?? ["processing_failed"],
      nextActionCodes:
        currentDiagnostics?.nextActionCodes ?? nextActionCodesForReason("processing_failed"),
      bestCoveredContentTypes: currentDiagnostics?.bestCoveredContentTypes ?? [],
      underrepresentedContentTypes: currentDiagnostics?.underrepresentedContentTypes ?? [],
      pendingRebuild: {
        status: "failed",
        reasonCode: "processing_failed",
        nextActionCodes: nextActionCodesForReason("processing_failed")
      },
      materialBase,
      createdAt: currentDiagnostics?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    yield* database.voiceProfileDiagnostics.put(diagnostics).pipe(Effect.orDie);
  });
}

function clearProfileImpactFlags(
  database: DatabaseClient,
  examples: readonly VoiceExampleRecord[],
  activeVersion: number,
  timestamp: string
) {
  return Effect.forEach(
    examples.filter(
      (example) =>
        example.pendingProfileImpact &&
        (example.targetProfileVersion === undefined || example.targetProfileVersion <= activeVersion)
    ),
    (example) =>
      database.voiceExamples.save({
        ...example,
        pendingProfileImpact: false,
        targetProfileVersion: activeVersion,
        updatedAt: timestamp
      }).pipe(Effect.orDie),
    { concurrency: 1, discard: true }
  );
}
