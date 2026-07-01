import { Effect, Schedule } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import {
  CALIBRATION_WIZARD_STEPS,
  VOICE_CALIBRATION_PLAN_LIMITS,
  type WizardStepId
} from "@my-ai-orchestrator/domain";
import type {
  ConfirmWizardReviewInput,
  SetWizardContextInput,
  SubmitWizardStepInput,
  VoiceCalibrationEntitlementView,
  VoiceCalibrationSessionView,
  VoiceCalibrationStepPromptView,
  VoiceCalibrationStepState
} from "@my-ai-orchestrator/contracts";
import type { VoiceExample } from "@my-ai-orchestrator/domain";
import {
  BackendVoiceCalibrationSessionNotFoundError,
  BackendVoiceCalibrationValidationError
} from "../../http/errors.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BillingPlanTier } from "../ai-policy/ai-policy-types.js";
import { resolveStoredUserPlanTier } from "../billing/resolve-user-billing.js";
import { buildStepPrompt } from "./voice-calibration-candidates.js";
import {
  countCompletedVoiceCalibrationSessions,
  createVoiceCalibrationSession,
  getVoiceCalibrationSession,
  refreshSessionStepPrompts,
  saveVoiceCalibrationSession,
  type VoiceCalibrationSessionRecord
} from "./voice-calibration-session-store.js";
import {
  buildWizardExampleLabels,
  canAdvance,
  countWords,
  resolveStepTargetWords,
  resolveTextLengthBucket,
  shouldTriggerRebuildOnStep
} from "./voice-calibration-service-helpers.js";
import type { BackendVoiceCalibrationService } from "./voice-calibration-types.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import {
  extractDeterministicFeatures,
  type DeterministicFeatures
} from "./deterministic-extraction.js";
import { recordWizardStepFailure } from "./voice-calibration-failures.js";
import {
  buildExampleId,
  buildInitialEvaluation,
  resolveContentTypeHints,
  resolveTargetProfileVersion
} from "./voice-shared.js";

const EMPTY_DETERMINISTIC_FEATURES: DeterministicFeatures = extractDeterministicFeatures("");

const WRITABLE_STEP_IDS = new Set<WizardStepId>([
  "micro_opinion",
  "reasoning_reflection",
  "argument_development",
  "format_adaptation"
]);

function resolvePlanTier(
  billing: BillingServiceContract,
  userId: string
): keyof typeof VOICE_CALIBRATION_PLAN_LIMITS {
  const tier = resolveStoredUserPlanTier(billing, userId);
  return mapBillingPlanTierToCalibrationLimits(tier);
}

function mapBillingPlanTierToCalibrationLimits(
  tier: BillingPlanTier
): keyof typeof VOICE_CALIBRATION_PLAN_LIMITS {
  if (tier === "pro" || tier === "enterprise") {
    return "pro";
  }

  if (tier === "starter") {
    return "criador";
  }

  return "free";
}

function toSessionView(session: VoiceCalibrationSessionRecord): VoiceCalibrationSessionView {
  const completedStepCount = session.steps.filter(
    (step) => step.submittedAt !== undefined || step.skipped === true
  ).length;

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    status: session.status,
    context: session.context,
    currentStepId: session.currentStepId,
    steps: session.steps,
    completedStepCount,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function requireSession(
  sessionId: string,
  userId: string
): Effect.Effect<VoiceCalibrationSessionRecord, BackendVoiceCalibrationSessionNotFoundError> {
  const session = getVoiceCalibrationSession(sessionId);
  if (!session || session.userId !== userId) {
    return Effect.fail(
      new BackendVoiceCalibrationSessionNotFoundError({
        sessionId,
        userId
      })
    );
  }

  return Effect.succeed(session);
}

function assertSessionInProgress(session: VoiceCalibrationSessionRecord): Effect.Effect<void, BackendVoiceCalibrationValidationError> {
  if (session.status !== "in_progress") {
    return Effect.fail(
      new BackendVoiceCalibrationValidationError({
        sessionId: session.sessionId,
        message: `Calibration session is ${session.status}`
      })
    );
  }

  return Effect.succeed(undefined);
}

function advanceSessionStep(session: VoiceCalibrationSessionRecord, now: () => Date): void {
  const stepIds = CALIBRATION_WIZARD_STEPS.map((step) => step.id);
  const currentIndex = stepIds.indexOf(session.currentStepId);
  if (currentIndex >= 0 && currentIndex < stepIds.length - 1) {
    session.currentStepId = stepIds[currentIndex + 1]!;
  }
  session.updatedAt = now().toISOString();
}

function updateStepState(
  steps: VoiceCalibrationStepState[],
  stepId: string,
  patch: Partial<VoiceCalibrationStepState>
): VoiceCalibrationStepState[] {
  return steps.map((step) => (step.stepId === stepId ? { ...step, ...patch } : step));
}

function extractFeaturesWithRetry(text: string): Effect.Effect<DeterministicFeatures> {
  return Effect.try(() => extractDeterministicFeatures(text)).pipe(
    Effect.retry(Schedule.recurs(1)),
    Effect.orElseSucceed(() => EMPTY_DETERMINISTIC_FEATURES)
  );
}

function createWizardVoiceExample(
  database: DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  now: () => Date,
  voiceConsent: BackendVoiceConsentService | undefined,
  args: {
    readonly userId: string;
    readonly sessionId: string;
    readonly stepId: WizardStepId;
    readonly text: string;
    readonly topicTag: string;
    readonly deterministicFeatures: DeterministicFeatures;
    readonly textLengthBucket: string;
  }
) {
  return Effect.gen(function* () {
    if (voiceConsent) {
      yield* voiceConsent.assertConsent(args.userId);
    }

    const created = yield* database.transaction((trxDatabase) =>
      Effect.gen(function* () {
        const existing = yield* trxDatabase.voiceExamples.listByUser(args.userId);
        const timestamp = now().toISOString();
        const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, args.userId);
        const evaluation = buildInitialEvaluation({
          text: args.text,
          pinned: false
        });

        const example: VoiceExample = {
          id: buildExampleId(args.userId, existing.length + 1),
          userId: args.userId,
          text: args.text.trim(),
          language: "pt-BR",
          state: "active",
          classificationLabels: [...buildWizardExampleLabels(args.stepId, args.topicTag)],
          antiPatternsExplicit: [],
          pinned: false,
          pendingProfileImpact: true,
          targetProfileVersion,
          effectiveContentTypeHints: resolveContentTypeHints(undefined, undefined),
          topicTag: args.topicTag,
          textLengthBucket: args.textLengthBucket,
          deterministicFeatures: args.deterministicFeatures,
          context: `wizard_calibration:${args.sessionId}:${args.stepId}`,
          evaluation,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        return yield* trxDatabase.voiceExamples.create(example).pipe(Effect.orDie);
      })
    ).pipe(
      Effect.retry(Schedule.recurs(2)),
      Effect.catchTag("DatabaseTransactionInvariantError", (error) => Effect.die(error)),
      Effect.tapError((error) =>
        Effect.sync(() =>
          recordWizardStepFailure({
            stepId: args.stepId,
            userId: args.userId,
            sessionId: args.sessionId,
            error: String(error),
            attemptCount: 3,
            failedAt: now().toISOString(),
            phase: "example_save"
          })
        )
      )
    );

    if (shouldTriggerRebuildOnStep(args.stepId)) {
      yield* voiceRebuild.schedule(args.userId);
    }

    return created;
  });
}

export function createBackendVoiceCalibrationService(
  database: DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  billing: BillingServiceContract,
  now: () => Date,
  voiceConsent?: BackendVoiceConsentService,
  logger?: AppLogger
): BackendVoiceCalibrationService {
  return {
    startSession(userId) {
      return Effect.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }

        const planTier = resolvePlanTier(billing, userId);
        const limits = VOICE_CALIBRATION_PLAN_LIMITS[planTier];
        const completed = countCompletedVoiceCalibrationSessions(userId);
        if (completed >= limits.maxWizards) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              message: `Voice calibration wizard limit reached for ${planTier} plan`
            })
          );
        }

        const session = createVoiceCalibrationSession(userId, now);
        logger?.info("Started voice calibration session", {
          userId,
          sessionId: session.sessionId
        });
        return toSessionView(session);
      });
    },

    setContext(sessionId, userId, context) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        yield* assertSessionInProgress(session);

        if (session.currentStepId !== "micro_opinion") {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              message: "Wizard context can only be set before the first step is submitted"
            })
          );
        }

        session.context = context;
        refreshSessionStepPrompts(session, now);
        saveVoiceCalibrationSession(session);
        return toSessionView(session);
      });
    },

    getSession(sessionId, userId) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        return toSessionView(session);
      });
    },

    getStepPrompt(sessionId, userId, stepId) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        yield* assertSessionInProgress(session);

        const built = buildStepPrompt(stepId, session.context, session.themeRotationIndex);
        return {
          stepId,
          prompt: built.prompt,
          theme: built.theme,
          targetWords: built.targetWords,
          maxWords: built.maxWords,
          minWords: built.minWords
        } satisfies VoiceCalibrationStepPromptView;
      });
    },

    submitStep(sessionId, userId, input) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        yield* assertSessionInProgress(session);

        if (input.stepId !== session.currentStepId) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              stepId: input.stepId,
              message: `Expected step ${session.currentStepId}, received ${input.stepId}`
            })
          );
        }

        if (!WRITABLE_STEP_IDS.has(input.stepId as WizardStepId)) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              stepId: input.stepId,
              message: `Step ${input.stepId} does not accept text submission`
            })
          );
        }

        const text = input.text.trim();
        if (text.length === 0) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              stepId: input.stepId,
              message: "Step text cannot be empty"
            })
          );
        }

        const wordCount = countWords(text);
        const targetWords = resolveStepTargetWords(input.stepId as WizardStepId);
        if (targetWords !== undefined && !canAdvance(targetWords, wordCount)) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              stepId: input.stepId,
              message: `Text must contain at least ${Math.floor(targetWords * 0.5)} words`
            })
          );
        }

        const stepState = session.steps.find((step) => step.stepId === input.stepId);
        const topicTag = stepState?.theme ?? input.stepId;
        const deterministicFeatures = yield* extractFeaturesWithRetry(text);
        const textLengthBucket = resolveTextLengthBucket(wordCount);

        const example = yield* createWizardVoiceExample(database, voiceRebuild, now, voiceConsent, {
          userId,
          sessionId,
          stepId: input.stepId as WizardStepId,
          text,
          topicTag,
          deterministicFeatures,
          textLengthBucket
        });

        session.exampleIdsByStepId[input.stepId] = example.id;
        session.steps = updateStepState(session.steps, input.stepId, {
          text,
          wordCount,
          skipped: false,
          submittedAt: now().toISOString()
        });
        advanceSessionStep(session, now);
        saveVoiceCalibrationSession(session);

        logger?.info("Submitted voice calibration step", {
          userId,
          sessionId,
          stepId: input.stepId,
          exampleId: example.id
        });

        return toSessionView(session);
      });
    },

    skipStep(sessionId, userId, stepId) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        yield* assertSessionInProgress(session);

        if (stepId !== session.currentStepId) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              stepId,
              message: `Expected step ${session.currentStepId}, received ${stepId}`
            })
          );
        }

        if (!WRITABLE_STEP_IDS.has(stepId)) {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              stepId,
              message: `Step ${stepId} cannot be skipped`
            })
          );
        }

        session.steps = updateStepState(session.steps, stepId, {
          skipped: true,
          submittedAt: now().toISOString()
        });
        advanceSessionStep(session, now);
        saveVoiceCalibrationSession(session);

        logger?.info("Skipped voice calibration step", {
          userId,
          sessionId,
          stepId
        });

        return toSessionView(session);
      });
    },

    completeReview(sessionId, userId, _input: ConfirmWizardReviewInput) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        yield* assertSessionInProgress(session);

        if (session.currentStepId !== "review_confirm") {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              message: "Review can only be completed on the review step"
            })
          );
        }

        session.status = "completed";
        session.steps = updateStepState(session.steps, "review_confirm", {
          submittedAt: now().toISOString()
        });
        session.updatedAt = now().toISOString();
        saveVoiceCalibrationSession(session);

        yield* voiceRebuild.schedule(userId);

        logger?.info("Completed voice calibration session", {
          userId,
          sessionId
        });

        return toSessionView(session);
      });
    },

    getEntitlement(userId) {
      return Effect.sync(() => {
        const planTier = resolvePlanTier(billing, userId);
        const limits = VOICE_CALIBRATION_PLAN_LIMITS[planTier];
        const completedWizards = countCompletedVoiceCalibrationSessions(userId);
        const remainingWizards = Math.max(0, limits.maxWizards - completedWizards);

        return {
          planTier,
          maxWizards: limits.maxWizards,
          completedWizards,
          remainingWizards,
          chargesQuota: limits.chargesQuota,
          maxConfidenceFromCalibration: limits.maxConfidenceFromCalibration
        } satisfies VoiceCalibrationEntitlementView;
      });
    }
  };
}
