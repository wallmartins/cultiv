import { Effect } from "effect";
import { describe, expect, it, beforeEach } from "vitest";
import { createBackendProductServices } from "../src/product/core/services.js";
import type { BackendConfig } from "../src/config/config.js";
import { THEMES_BY_DOMAIN } from "../src/product/voice/voice-calibration-context.js";
import { resetVoiceCalibrationSessionStore } from "../src/product/voice/voice-calibration-session-store.js";

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
        domain: "tecnologia",
        audience: "colegas de produto"
      })
    );

    expect(updated.context).toEqual({
      domain: "tecnologia",
      audience: "colegas de produto"
    });
  });

  it("submits a step with valid text and creates a wizard voice example", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_3"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_3"));
    Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_3", {
        domain: "tecnologia"
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
        domain: "tecnologia"
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

  it("personalizes micro_opinion theme for tecnologia domain", () => {
    const services = createServices();
    Effect.runSync(services.voiceConsent.grantConsent("user_cal_5"));

    const started = Effect.runSync(services.voiceCalibration.startSession("user_cal_5"));
    Effect.runSync(
      services.voiceCalibration.setContext(started.sessionId, "user_cal_5", {
        domain: "tecnologia"
      })
    );

    const prompt = Effect.runSync(
      services.voiceCalibration.getStepPrompt(started.sessionId, "user_cal_5", "micro_opinion")
    );

    expect(prompt.theme).toBe(THEMES_BY_DOMAIN.tecnologia.opinion);
    expect(prompt.prompt).toContain(THEMES_BY_DOMAIN.tecnologia.opinion);
  });
});
