import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { OnboardingStatusView, VoiceTrainingConsentStatusView } from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { createVoiceExampleInDatabase } from "../../apps/backend/tests/test-helpers.js";
import { deriveAppMode } from "../../packages/shared/src/derive/app-mode.js";
import { hasVoiceProfile } from "../../packages/shared/src/derive/voice-profile.js";

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
  reasoningSignatureV1Enabled: true
};

// The four writing steps of CALIBRATION_WIZARD_STEPS — context_setup and review_confirm
// produce no text, so a completed onboarding wizard yields exactly these.
const WIZARD_ANSWERS = [
  {
    step: "micro_opinion",
    text: "Trabalho remoto funciona quando a empresa escreve bem. Sem escrita clara, vira reunião infinita e ninguém decide nada sozinho."
  },
  {
    step: "reasoning_reflection",
    text: "Aprendi que otimizar cedo demais custa caro. Passei semanas afinando uma consulta que rodava duas vezes por dia, enquanto o gargalo real estava num loop bobo no worker. Desde então meço antes de mexer, e isso mudou como escolho onde gastar tempo."
  },
  {
    step: "argument_development",
    text: "Defendo que previsibilidade vale mais que pico de performance. Um sistema que responde em 200ms sempre é melhor que um que responde em 50ms na média e 4s no percentil 99. O usuário sente a variância, não a média. Times que perseguem benchmark acabam entregando algo que ninguém consegue operar de madrugada."
  },
  {
    step: "format_adaptation",
    text: "Índice de banco é como o sumário de um livro. Sem ele, para achar um capítulo você folheia página por página. Com ele, você olha uma lista curta e pula direto. O custo é que toda vez que o livro muda, o sumário precisa ser reimpresso."
  }
] as const;

describe("onboarding lockout", () => {
  it("does not lock the app after a completed calibration wizard", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-07-23T12:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_1"));

    for (const answer of WIZARD_ANSWERS) {
      Effect.runSync(
        createVoiceExampleInDatabase(services.database, "user_1", {
          text: answer.text,
          language: "pt-BR",
          topicTag: answer.step
        })
      );
    }

    Effect.runSync(services.voiceRebuild.schedule("user_1"));
    await Effect.runPromise(services.voiceRebuild.drain("user_1"));

    const screen = Effect.runSync(services.voice.getProfileScreen("user_1"));
    expect(screen).toBeDefined();

    // What /voice renders from: a real, populated profile.
    expect(screen?.materialBase.activeExamples).toBe(4);
    expect(hasVoiceProfile(screen)).toBe(true);

    // What the shell gate renders from. These must not disagree.
    const onboarding = { completed: true } as unknown as OnboardingStatusView;
    const consent = { granted: true } as unknown as VoiceTrainingConsentStatusView;

    // Four writing steps IS a complete calibration — nothing to complain about.
    expect(screen?.diagnostics.reasonCodes).not.toContain("insufficient_examples");
    expect(deriveAppMode(onboarding, consent, screen?.diagnostics)).toBe("normal");
  });

  it("lets a complete calibration reach full confidence on four examples", async () => {
    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-07-23T12:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_confidence"));

    for (const answer of WIZARD_ANSWERS) {
      Effect.runSync(
        createVoiceExampleInDatabase(services.database, "user_confidence", {
          text: answer.text,
          language: "pt-BR",
          topicTag: answer.step
        })
      );
    }

    Effect.runSync(services.voiceRebuild.schedule("user_confidence"));
    await Effect.runPromise(services.voiceRebuild.drain("user_confidence"));

    const screen = Effect.runSync(services.voice.getProfileScreen("user_confidence"));

    // Both halves of the profile landed, so the example count must not be what holds it back.
    expect(screen?.reasoning?.core.narrativeProse).toBeTruthy();
    expect(screen?.profile.confidence).toBe("high");
  });

  it("still locks when consent is refused", () => {
    const onboarding = { completed: true } as unknown as OnboardingStatusView;
    const refused = { granted: false } as unknown as VoiceTrainingConsentStatusView;

    expect(deriveAppMode(onboarding, refused, undefined)).toBe("locked");
  });
});
