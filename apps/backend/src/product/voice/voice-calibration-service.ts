import { Effect, Schedule } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import { toPracticeProfileDomain, type DatabaseClient } from "@my-ai-orchestrator/database";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import {
  CALIBRATION_WIZARD_STEPS,
  VOICE_CALIBRATION_PLAN_LIMITS,
  type WizardStepId
} from "@my-ai-orchestrator/domain";
import type {
  ConfirmWizardReviewInput,
  PracticeProfile,
  SetWizardContextInput,
  SubmitWizardStepInput,
  VoiceCalibrationEntitlementView,
  VoiceCalibrationSessionView,
  VoiceCalibrationStepPromptView,
  VoiceCalibrationStepState,
  WizardContext
} from "@my-ai-orchestrator/contracts";
import type { VoiceExample } from "@my-ai-orchestrator/domain";
import {
  BackendVoiceCalibrationDerivationError,
  BackendVoiceCalibrationSessionNotFoundError,
  BackendVoiceCalibrationValidationError
} from "../../http/errors.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BillingPlanTier, BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import { resolveStoredUserPlanTier } from "../billing/resolve-user-billing.js";
import { buildStepPrompt, type WizardStepAnchor } from "./voice-calibration-candidates.js";
import {
  agnosticCalibrationAnchors,
  contractsProfileToDomain,
  domainProfileToContracts,
  generateCalibrationAnchors,
  generateSeedPracticeProfile,
  resolvePracticeProfileAttempts,
  resolvePracticeProfileLocale,
  sameDeclaredAxes,
  type CalibrationAnchorSet,
  type DeclaredPracticeAxes,
  type PracticeProfileGenerationDeps,
  type PracticeProfileLocale
} from "../practice-profile/index.js";
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

const SET_CONTEXT_DERIVATION_TIMEOUT = "60 seconds";

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
    readonly language: string;
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
          language: args.language,
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

// The generation surfaces (G1 seed + G3 anchors) that setContext drives. Optional: when absent (unit
// tests, a deployment without the practice-profile routing profile) the wizard keeps the legacy
// theme-based prompts and never blocks.
export interface VoiceCalibrationPracticeProfileDeps {
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly aiPolicy: BackendAIPolicyServiceContract;
}

function toDeclaredAxes(context: WizardContext): DeclaredPracticeAxes | undefined {
  const subject = context.subject?.trim();
  const vantagePoint = context.vantagePoint?.trim();
  const audiences = (context.audiences ?? []).map((audience) => audience.trim()).filter((audience) => audience.length > 0);
  if (!subject || !vantagePoint || audiences.length === 0) {
    return undefined;
  }
  return { subject, vantagePoint, audiences };
}

function indexAnchorsByStep(anchors: CalibrationAnchorSet): Partial<Record<WizardStepId, WizardStepAnchor>> {
  const byStep: Partial<Record<WizardStepId, WizardStepAnchor>> = {};
  for (const anchor of anchors) {
    byStep[anchor.wizardStepId] = { prompt: anchor.prompt, wordTarget: anchor.wordTarget };
  }
  return byStep;
}

// F3-1/F3-4 — derive the seed Practice Profile (G1) and generated calibration anchors (G3) between
// wizard screen 1 and 2. Returns undefined (legacy prompts) when the feature is not configured, and
// fails with BackendVoiceCalibrationDerivationError when the provider chain is exhausted (F3-2 hard
// block). G3 alone degrades to field-agnostic wording — only G1 blocks (norte gerador-spec §G1/§G3).
function deriveCalibrationAnchors(args: {
  readonly practiceProfile: VoiceCalibrationPracticeProfileDeps | undefined;
  readonly database: DatabaseClient;
  readonly now: () => Date;
  readonly logger: AppLogger | undefined;
  readonly sessionId: string;
  readonly userId: string;
  readonly context: WizardContext;
  readonly locale: PracticeProfileLocale;
}): Effect.Effect<Partial<Record<WizardStepId, WizardStepAnchor>> | undefined, BackendVoiceCalibrationDerivationError> {
  return Effect.gen(function* () {
    if (!args.practiceProfile) {
      return undefined;
    }

    const axes = toDeclaredAxes(args.context);
    if (!axes) {
      return undefined;
    }

    const policy = yield* args.practiceProfile.aiPolicy.getActivePolicy().pipe(
      Effect.mapError((error) => new BackendVoiceCalibrationDerivationError({ sessionId: args.sessionId, message: error.message }))
    );
    const attempts = resolvePracticeProfileAttempts(policy);
    if (attempts.length === 0) {
      // Deps are wired but the practice-profile routing profile is absent/empty in the active policy —
      // a misconfiguration (F2-2 expects it live in prod), not a deliberate off state. Warn so it's
      // distinguishable from the deps-absent path above, then fall back to the legacy prompts.
      args.logger?.warn("Practice profile routing profile has no attempts; skipping seed derivation", {
        userId: args.userId,
        sessionId: args.sessionId
      });
      return undefined;
    }

    const deps: PracticeProfileGenerationDeps = {
      attempts,
      aiAdapters: args.practiceProfile.aiAdapters,
      providerTransport: args.practiceProfile.providerTransport
    };

    // C-1 idempotency guard (ADR 0010 §4): identical declared axes reuse the stored profile — an
    // enriched profile never regresses to a fresh seed on a wizard re-run. Changed axes are a
    // legitimate re-seed (recalibration = a new lifecycle), with the version bumped past the old one.
    const existingRecord = yield* args.database.practiceProfiles.getByUser(args.userId).pipe(Effect.orDie);
    const existing = existingRecord ? toPracticeProfileDomain(existingRecord) : undefined;

    let profile: PracticeProfile;
    if (existing && sameDeclaredAxes(existing, axes)) {
      profile = domainProfileToContracts(existing);
    } else {
      const seed = yield* generateSeedPracticeProfile({
        userId: args.userId,
        version: (existing?.version ?? 0) + 1,
        axes,
        locale: args.locale,
        deps
      }).pipe(
        Effect.mapError(
          (error) => new BackendVoiceCalibrationDerivationError({ sessionId: args.sessionId, message: error.message })
        )
      );

      const timestamp = args.now().toISOString();
      yield* args.database.practiceProfiles
        .put(contractsProfileToDomain(seed, { createdAt: timestamp, updatedAt: timestamp }), seed.version)
        .pipe(Effect.orDie);
      profile = seed;
    }

    const anchorSet = yield* generateCalibrationAnchors({ profile, locale: args.locale, deps }).pipe(
      Effect.tapError((error) =>
        Effect.sync(() =>
          args.logger?.warn("Calibration anchor generation failed; using field-agnostic anchors", {
            userId: args.userId,
            sessionId: args.sessionId,
            reason: error.message
          })
        )
      ),
      Effect.orElseSucceed(() => agnosticCalibrationAnchors(args.locale))
    );

    return indexAnchorsByStep(anchorSet);
  });
}

export function createBackendVoiceCalibrationService(
  database: DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  billing: BillingServiceContract,
  now: () => Date,
  voiceConsent?: BackendVoiceConsentService,
  logger?: AppLogger,
  practiceProfile?: VoiceCalibrationPracticeProfileDeps
): BackendVoiceCalibrationService {
  return {
    startSession(userId) {
      return Effect.gen(function* () {
        // No consent gate here: starting a session persists no voice data, and a brand-new author
        // is routed straight to the wizard before they can grant anything — gating this 403s them
        // out of onboarding entirely. Consent is enforced at the write path (createWizardVoiceExample),
        // and the frontend collects it on the context step before the first submission.
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

    setContext(sessionId, userId, input) {
      return Effect.gen(function* () {
        const session = yield* requireSession(sessionId, userId);
        yield* assertSessionInProgress(session);

        if (session.currentStepId !== "context_setup" && session.currentStepId !== "micro_opinion") {
          return yield* Effect.fail(
            new BackendVoiceCalibrationValidationError({
              sessionId,
              message: "Wizard context can only be set before the first step is submitted"
            })
          );
        }

        const { locale: requestedLocale, ...context } = input;
        const locale = resolvePracticeProfileLocale(requestedLocale);

        // Derive first: a G1 failure aborts here (F3-2 hard block) BEFORE any session mutation, so the
        // wizard stays on context_setup and the client can retry cleanly against an untouched session.
        // C-7: an aggregate ceiling over G1+G3 — the worst-case provider chain (~240s) must not sit in
        // the onboarding critical path; overflow takes the same hard-block path (500 + visible retry).
        const anchorsByStepId = yield* deriveCalibrationAnchors({
          practiceProfile,
          database,
          now,
          logger,
          sessionId,
          userId,
          context,
          locale
        }).pipe(
          Effect.timeoutFail({
            duration: SET_CONTEXT_DERIVATION_TIMEOUT,
            onTimeout: () =>
              new BackendVoiceCalibrationDerivationError({
                sessionId,
                message: "Practice profile derivation timed out"
              })
          })
        );

        session.context = context;
        session.locale = locale;
        if (anchorsByStepId) {
          session.anchorsByStepId = anchorsByStepId;
        }
        refreshSessionStepPrompts(session, now);

        if (session.currentStepId === "context_setup") {
          advanceSessionStep(session, now);
        }

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

        const built = buildStepPrompt(stepId, session.anchorsByStepId?.[stepId]);
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
          textLengthBucket,
          language: session.locale ?? "pt-BR"
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
