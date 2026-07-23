import { Cause, Effect, Exit, Fiber, Option, TestClock, TestContext } from "effect";
import { describe, expect, it, beforeEach } from "vitest";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import { createBackendProductServices } from "../src/product/core/services.js";
import type { BackendConfig } from "../src/config/config.js";
import type { BackendAIPolicyServiceContract } from "../src/product/ai-policy/ai-policy-types.js";
import {
  TEST_CALIBRATION_ANCHORS_FIXTURE,
  TEST_PRACTICE_PROFILE_SEED_FIXTURE
} from "../src/product/practice-profile/practice-profile-test-fixtures.js";
import {
  agnosticCalibrationAnchors,
  PRACTICE_PROFILE_ROUTING_PROFILE_ID
} from "../src/product/practice-profile/index.js";
import {
  createBackendVoiceCalibrationService,
  type VoiceCalibrationPracticeProfileDeps
} from "../src/product/voice/voice-calibration-service.js";
import type { BackendVoiceRebuildService } from "../src/product/voice/voice-rebuild-types.js";
import { resetVoiceCalibrationSessionStore } from "../src/product/voice/voice-calibration-session-store.js";

const FULL_AXES = {
  subject: "plataformas de containers",
  vantagePoint: "engenheiro de plataforma numa startup de 5 pessoas",
  audiences: ["engenheiros backend"]
} as const;

const config: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0",
  billingPlanId: "pro",
  billingUserId: "backend",
  allowInMemoryRuntime: true
};

const MICRO_OPINION_TEXT =
  "Acredito que aprender a programar em 2026 ainda vale a pena porque a tecnologia continua mudando o mercado de trabalho. " +
  "Mesmo com ferramentas de inteligência artificial, entender lógica e estrutura ajuda a tomar decisões melhores. " +
  "Para mim, programar não é só escrever código, é aprender a pensar com clareza e resolver problemas reais.";

function createServices() {
  return Effect.runSync(
    createBackendProductServices(config, {
      now: () => new Date("2026-06-30T12:00:00.000Z")
    })
  );
}

describe("voice calibration service", () => {
  beforeEach(() => {
    resetVoiceCalibrationSessionStore();
  });

  it("starts a session", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_1"));

    const session = Effect.runSync(services.voiceCalibration.startSession("user_cal_1"));

    expect(session.sessionId).toMatch(/^voice-calibration:/);
    expect(session.userId).toBe("user_cal_1");
    expect(session.status).toBe("in_progress");
    expect(session.currentStepId).toBe("context_setup");
    expect(session.steps).toHaveLength(6);
    expect(session.completedStepCount).toBe(0);
  });

  it("sets wizard context before the first submission", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_2"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_2"));
    const updated = Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_2", {
        subject: "tecnologia",
        vantagePoint: "praticante autônomo",
        audiences: ["colegas de produto"]
      })
    );

    expect(updated.context).toEqual({
      subject: "tecnologia",
      vantagePoint: "praticante autônomo",
      audiences: ["colegas de produto"]
    });
  });

  it("submits a step with valid text and creates a wizard voice example", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_3"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_3"));
    Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_3", {
        subject: "tecnologia"
      })
    );
    const submitted = Effect.runSync(
      services.voiceCalibration.submitStep(started.sessionId, "user_cal_3", {
        stepId: "micro_opinion",
        text: MICRO_OPINION_TEXT
      })
    );

    const microStep = submitted.steps.find((step) => step.stepId === "micro_opinion");
    expect(microStep?.submittedAt).toBeDefined();
    expect(microStep?.wordCount).toBeGreaterThanOrEqual(30);
    expect(submitted.currentStepId).toBe("reasoning_reflection");
    expect(submitted.completedStepCount).toBe(1);

    const examples = Effect.runSync(services.database.voiceExamples.listByUser("user_cal_3"));
    expect(examples.length).toBe(1);
    expect(examples[0]?.classificationLabels).toEqual(["micro_opinion", "wizard_calibration"]);
  });

  it("skips the current step and advances the wizard", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_4"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_4"));
    Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_4", {
        subject: "tecnologia"
      })
    );
    const skipped = Effect.runSync(
      services.voiceCalibration.skipStep(started.sessionId, "user_cal_4", "micro_opinion")
    );

    const microStep = skipped.steps.find((step) => step.stepId === "micro_opinion");
    expect(microStep?.skipped).toBe(true);
    expect(microStep?.submittedAt).toBeDefined();
    expect(skipped.currentStepId).toBe("reasoning_reflection");
    expect(skipped.completedStepCount).toBe(1);

    const examples = Effect.runSync(services.database.voiceExamples.listByUser("user_cal_4"));
    expect(examples.length).toBe(0);
  });

  // F3-4: with the full declared axes, setContext derives a seed profile and the generated calibration
  // anchors (G3) replace the legacy per-domain theme.
  it("uses the generated calibration anchor for micro_opinion when full axes are declared", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_5"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_5"));
    Effect.runSync(services.voiceCalibration.setContext(started.sessionId, "user_cal_5", FULL_AXES));

    const prompt = Effect.runSync(
      services.voiceCalibration.getStepPrompt(started.sessionId, "user_cal_5", "micro_opinion")
    );

    expect(prompt.prompt).toBe(TEST_CALIBRATION_ANCHORS_FIXTURE.anchors.microOpinion);
    expect(prompt.targetWords).toBe(60);
  });

  it("persists a seed practice profile when full axes are declared", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_6"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_6"));
    Effect.runSync(services.voiceCalibration.setContext(started.sessionId, "user_cal_6", FULL_AXES));

    const profile = Effect.runSync(services.database.practiceProfiles.getByUser("user_cal_6"));
    expect(profile?.depth).toBe("seed");
    expect(profile?.subject).toBe(FULL_AXES.subject);
    expect(profile?.audiences).toEqual(FULL_AXES.audiences);
  });

  // Legacy fallback: partial axes never trigger derivation, so no profile is created and the wizard keeps
  // the default prompt text.
  it("skips derivation and keeps the default prompt when axes are incomplete", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_7"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_7"));
    Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_7", { subject: "tecnologia" })
    );

    const profile = Effect.runSync(services.database.practiceProfiles.getByUser("user_cal_7"));
    expect(profile).toBeUndefined();

    const prompt = Effect.runSync(
      services.voiceCalibration.getStepPrompt(started.sessionId, "user_cal_7", "micro_opinion")
    );
    expect(prompt.prompt).toBe("Qual é a sua opinião sobre trabalho remoto?");
  });

  it("stamps wizard examples with the requested locale", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_8"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_8"));
    Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_8", { ...FULL_AXES, locale: "en" })
    );
    Effect.runSync(
      services.voiceCalibration.submitStep(started.sessionId, "user_cal_8", {
        stepId: "micro_opinion",
        text: MICRO_OPINION_TEXT
      })
    );

    const examples = Effect.runSync(services.database.voiceExamples.listByUser("user_cal_8"));
    expect(examples[0]?.language).toBe("en-US");
  });

  // F3-2 onboarding floor: an exhausted provider chain blocks step 1→2 (no generic escape) and leaves the
  // session untouched so the client can retry cleanly. The session store is a shared singleton, so the
  // real service starts the session and a second instance with a failing policy drives setContext.
  it("hard-blocks setContext and leaves the session untouched when seed derivation fails", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_9"));
    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_9"));

    const failingDeps = {
      aiAdapters: {},
      providerTransport: {},
      aiPolicy: {
        getActivePolicy: () => Effect.fail(new Error("policy unavailable"))
      }
    } as unknown as VoiceCalibrationPracticeProfileDeps;

    const failingService = createBackendVoiceCalibrationService(
      services.database,
      { schedule: () => Effect.void, drain: () => Effect.void } as unknown as BackendVoiceRebuildService,
      {} as unknown as BillingServiceContract,
      () => new Date("2026-06-30T12:00:00.000Z"),
      services.voiceConsent,
      undefined,
      failingDeps
    );

    const outcome = Effect.runSyncExit(
      failingService.setContext(started.sessionId, "user_cal_9", FULL_AXES)
    );
    expect(Exit.isFailure(outcome)).toBe(true);

    const session = Effect.runSync(services.voiceCalibration.getSession(started.sessionId, "user_cal_9"));
    expect(session.currentStepId).toBe("context_setup");
    expect(session.context).toBeUndefined();

    const profile = Effect.runSync(services.database.practiceProfiles.getByUser("user_cal_9"));
    expect(profile).toBeUndefined();
  });

  // C-1 idempotency guard: identical axes on a wizard re-run reuse the stored profile — an enriched
  // profile never regresses to a fresh seed.
  it("keeps an enriched profile intact when the wizard re-runs with identical axes", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_10"));

    const first = Effect.runSync(services.voiceCalibration.startSession("user_cal_10"));
    Effect.runSync(services.voiceCalibration.setContext(first.sessionId, "user_cal_10", FULL_AXES));

    Effect.runSync(
      services.database.practiceProfiles.put(
        {
          id: "practice-profile:user_cal_10",
          userId: "user_cal_10",
          version: 2,
          depth: "enriched",
          subject: FULL_AXES.subject,
          vantagePoint: FULL_AXES.vantagePoint,
          audiences: FULL_AXES.audiences,
          dimensions: TEST_PRACTICE_PROFILE_SEED_FIXTURE.dimensions,
          createdAt: "2026-06-30T12:00:00.000Z",
          updatedAt: "2026-06-30T13:00:00.000Z"
        },
        2
      )
    );

    const second = Effect.runSync(services.voiceCalibration.startSession("user_cal_10"));
    Effect.runSync(services.voiceCalibration.setContext(second.sessionId, "user_cal_10", FULL_AXES));

    const profile = Effect.runSync(services.database.practiceProfiles.getByUser("user_cal_10"));
    expect(profile?.depth).toBe("enriched");
    expect(profile?.profileVersion).toBe(2);

    const prompt = Effect.runSync(
      services.voiceCalibration.getStepPrompt(second.sessionId, "user_cal_10", "micro_opinion")
    );
    expect(prompt.prompt).toBe(TEST_CALIBRATION_ANCHORS_FIXTURE.anchors.microOpinion);
  });

  // C-1: changed axes are a legitimate re-seed (recalibration = new lifecycle), version bumped past
  // the old profile.
  it("re-seeds with a bumped version when the wizard re-runs with changed axes", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_11"));

    const first = Effect.runSync(services.voiceCalibration.startSession("user_cal_11"));
    Effect.runSync(services.voiceCalibration.setContext(first.sessionId, "user_cal_11", FULL_AXES));

    const second = Effect.runSync(services.voiceCalibration.startSession("user_cal_11"));
    Effect.runSync(
      services.voiceCalibration.setContext(second.sessionId, "user_cal_11", {
        ...FULL_AXES,
        subject: "observabilidade em produção"
      })
    );

    const profile = Effect.runSync(services.database.practiceProfiles.getByUser("user_cal_11"));
    expect(profile?.depth).toBe("seed");
    expect(profile?.profileVersion).toBe(2);
    expect(profile?.subject).toBe("observabilidade em produção");
  });

  // C-7: the aggregate derivation ceiling — a hanging provider chain fails setContext through the same
  // hard-block path instead of holding the onboarding critical path open.
  it("times out setContext when derivation hangs, leaving the session untouched", async () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_12"));
    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_12"));

    const hangingDeps = {
      aiAdapters: {},
      providerTransport: {},
      aiPolicy: { getActivePolicy: () => Effect.never }
    } as unknown as VoiceCalibrationPracticeProfileDeps;

    const hangingService = createBackendVoiceCalibrationService(
      services.database,
      { schedule: () => Effect.void, drain: () => Effect.void } as unknown as BackendVoiceRebuildService,
      {} as unknown as BillingServiceContract,
      () => new Date("2026-06-30T12:00:00.000Z"),
      services.voiceConsent,
      undefined,
      hangingDeps
    );

    const exit = await Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* Effect.fork(
          Effect.exit(hangingService.setContext(started.sessionId, "user_cal_12", FULL_AXES))
        );
        yield* TestClock.adjust("61 seconds");
        return yield* Fiber.join(fiber);
      }).pipe(Effect.provide(TestContext.TestContext))
    );

    expect(Exit.isFailure(exit)).toBe(true);
    const failure = Exit.isFailure(exit) ? Cause.failureOption(exit.cause) : Option.none();
    expect(String((Option.getOrUndefined(failure) as { message?: string } | undefined)?.message)).toContain(
      "timed out"
    );

    const session = Effect.runSync(services.voiceCalibration.getSession(started.sessionId, "user_cal_12"));
    expect(session.currentStepId).toBe("context_setup");
    expect(session.context).toBeUndefined();
  });

  // C-11: G1 succeeds but the G3 anchor chain is exhausted — the wizard degrades to the field-agnostic
  // anchors instead of blocking (only G1 blocks).
  it("falls back to agnostic anchors when G1 succeeds and G3 fails", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_13"));
    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_13"));

    const seedOnlyAdapter: AIAdapterServiceContract = {
      complete: (call) =>
        call.request.metadata?.purpose === "practice-profile-seed"
          ? Effect.succeed({
              request: call.request,
              providerRequest: {} as never,
              response: {
                provider: call.request.provider,
                model: call.request.model,
                text: JSON.stringify(TEST_PRACTICE_PROFILE_SEED_FIXTURE)
              }
            })
          : Effect.fail(new AIAdapterTransportError({ provider: "gemini", message: "anchor chain down" }))
    } as AIAdapterServiceContract;

    const seedOnlyDeps = {
      aiAdapters: seedOnlyAdapter,
      providerTransport: { complete: () => Effect.succeed(undefined) },
      aiPolicy: {
        getActivePolicy: () =>
          Effect.succeed({
            routingProfiles: {
              [PRACTICE_PROFILE_ROUTING_PROFILE_ID]: {
                preferredAttempts: [{ provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 20000 }],
                fallbackAttempts: []
              }
            }
          })
      }
    } as unknown as VoiceCalibrationPracticeProfileDeps;

    const seedOnlyService = createBackendVoiceCalibrationService(
      services.database,
      { schedule: () => Effect.void, drain: () => Effect.void } as unknown as BackendVoiceRebuildService,
      {} as unknown as BillingServiceContract,
      () => new Date("2026-06-30T12:00:00.000Z"),
      services.voiceConsent,
      undefined,
      seedOnlyDeps
    );

    Effect.runSync(seedOnlyService.setContext(started.sessionId, "user_cal_13", FULL_AXES));

    const profile = Effect.runSync(services.database.practiceProfiles.getByUser("user_cal_13"));
    expect(profile?.depth).toBe("seed");

    const prompt = Effect.runSync(
      seedOnlyService.getStepPrompt(started.sessionId, "user_cal_13", "micro_opinion")
    );
    expect(prompt.prompt).toBe(agnosticCalibrationAnchors("pt-BR")[0]?.prompt);
  });
});
