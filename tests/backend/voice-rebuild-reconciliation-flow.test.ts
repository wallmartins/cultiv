import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import type { BackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";
import { createBackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";
import {
  TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT
} from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import {
  TEST_REASONING_EXTRACTION_FIXTURE_PT
} from "../../apps/backend/src/product/voice/reasoning-extraction.js";

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

describe("voice rebuild reconciliation flow", () => {
  it("skips reconciliation LLM when drafts align", async () => {
    const purposes: string[] = [];
    const baseTransport = createBackendProviderTransport({
      ...config,
      environment: "test"
    });

    const alignedTransport: BackendProviderTransport = {
      complete: (request) => {
        const purpose = request.metadata?.purpose;
        if (typeof purpose === "string") {
          purposes.push(purpose);
        }

        if (purpose === "argument-development-extraction") {
          return Effect.succeed({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    development: {
                      ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT.development,
                      developmentProse:
                        "Um arco distinto: cena, tensão, experimento e conclusão tardia sem repetir traços cognitivos.",
                      epistemicPosture: "investigative",
                      structuralAntiPatterns: ["pivoto_abrupto"]
                    }
                  })
                },
                finish_reason: "stop"
              }
            ]
          });
        }

        return baseTransport.complete(request);
      }
    };

    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-06-16T12:00:00.000Z"),
        providerTransport: alignedTransport
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_reconcile_skip"));

    Effect.runSync(
      services.voice.createExample("user_reconcile_skip", {
        text: "Eu começo observando o contexto antes de tirar conclusões no LinkedIn.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(
      services.voice.createExample("user_reconcile_skip", {
        text: "Outro exemplo no mesmo formato, com tom parecido e parágrafos curtos.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(services.voiceRebuild.schedule("user_reconcile_skip"));
    await Effect.runPromise(services.voiceRebuild.drain("user_reconcile_skip"));

    const extractionPurposes = purposes.filter(
      (purpose) => purpose === "reasoning-extraction" || purpose === "argument-development-extraction"
    );

    expect(extractionPurposes.length).toBeGreaterThanOrEqual(2);
    expect(purposes.filter((purpose) => purpose === "voice-signature-reconciliation")).toHaveLength(0);
  });

  it("invokes reconciliation LLM when drafts conflict", async () => {
    const purposes: string[] = [];
    const baseTransport = createBackendProviderTransport({
      ...config,
      environment: "test"
    });

    const conflictTransport: BackendProviderTransport = {
      complete: (request) => {
        const purpose = request.metadata?.purpose;
        if (typeof purpose === "string") {
          purposes.push(purpose);
        }

        if (purpose === "argument-development-extraction") {
          return Effect.succeed({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    development: {
                      ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT.development,
                      epistemicPosture: "exploratory",
                      developmentProse:
                        "Postura exploratória distinta que conflita com certeza alta no núcleo cognitivo."
                    }
                  })
                },
                finish_reason: "stop"
              }
            ]
          });
        }

        if (purpose === "reasoning-extraction") {
          return Effect.succeed({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    ...TEST_REASONING_EXTRACTION_FIXTURE_PT,
                    core: {
                      ...TEST_REASONING_EXTRACTION_FIXTURE_PT.core,
                      certaintyLevel: "high",
                      conclusionPace: "fast"
                    }
                  })
                },
                finish_reason: "stop"
              }
            ]
          });
        }

        return baseTransport.complete(request);
      }
    };

    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-06-17T12:00:00.000Z"),
        providerTransport: conflictTransport
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_reconcile_invoke"));

    Effect.runSync(
      services.voice.createExample("user_reconcile_invoke", {
        text: "Eu começo observando o contexto antes de tirar conclusões no LinkedIn.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(
      services.voice.createExample("user_reconcile_invoke", {
        text: "Outro exemplo no mesmo formato, com tom parecido e parágrafos curtos.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(services.voiceRebuild.schedule("user_reconcile_invoke"));
    await Effect.runPromise(services.voiceRebuild.drain("user_reconcile_invoke"));

    expect(purposes.filter((purpose) => purpose === "voice-signature-reconciliation")).toHaveLength(1);
  });

  it("keeps previous profile when reconciliation fails", async () => {
    const previousCore = {
      narrativeProse: "Previous valid reasoning snapshot.",
      certaintyLevel: "low" as const,
      judgmentFrequency: "low" as const,
      conclusionPace: "slow" as const,
      readerRelationship: "observer" as const,
      authoritySource: "lived_experience" as const,
      derivedAntiPatterns: ["generic guru tone"]
    };
    const previousDevelopment = {
      developmentProse: "Previous development snapshot.",
      moveLabels: ["observacao"],
      transitionTendencies: [],
      epistemicPosture: "investigative" as const,
      structuralAntiPatterns: []
    };

    const services = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-06-18T12:00:00.000Z")
      })
    );

    Effect.runSync(services.voiceConsent.grantConsent("user_reconcile_fail"));

    Effect.runSync(
      services.voice.createExample("user_reconcile_fail", {
        text: "Eu começo observando o contexto antes de tirar conclusões no LinkedIn.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(
      services.voice.createExample("user_reconcile_fail", {
        text: "Outro exemplo no mesmo formato, com tom parecido e parágrafos curtos.",
        language: "pt-BR",
        explicitContentType: "linkedin-post"
      })
    );

    Effect.runSync(services.voiceRebuild.schedule("user_reconcile_fail"));
    await Effect.runPromise(services.voiceRebuild.drain("user_reconcile_fail"));

    const baseline = Effect.runSync(services.database.voiceProfiles.getByUser("user_reconcile_fail"));
    expect(baseline).toBeDefined();
    Effect.runSync(
      services.database.voiceProfiles.put({
        ...baseline!,
        coreReasoningSignature: previousCore,
        argumentDevelopmentSignature: previousDevelopment
      })
    );

    const failingReconciliationTransport: BackendProviderTransport = {
      complete: (request) => {
        const purpose = request.metadata?.purpose;

        if (purpose === "argument-development-extraction") {
          return Effect.succeed({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    development: {
                      ...TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT.development,
                      epistemicPosture: "exploratory",
                      developmentProse: "Postura exploratória que conflita com o núcleo cognitivo."
                    }
                  })
                },
                finish_reason: "stop"
              }
            ]
          });
        }

        if (purpose === "reasoning-extraction") {
          return Effect.succeed({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    ...TEST_REASONING_EXTRACTION_FIXTURE_PT,
                    core: {
                      ...TEST_REASONING_EXTRACTION_FIXTURE_PT.core,
                      certaintyLevel: "high",
                      conclusionPace: "fast"
                    }
                  })
                },
                finish_reason: "stop"
              }
            ]
          });
        }

        if (purpose === "voice-signature-reconciliation") {
          return Effect.succeed({
            choices: [{ message: { content: "not-json" }, finish_reason: "stop" }]
          });
        }

        return createBackendProviderTransport({ ...config, environment: "test" }).complete(request);
      }
    };

    const rebuildServices = Effect.runSync(
      createBackendProductServices(config, {
        now: () => new Date("2026-06-18T13:00:00.000Z"),
        database: services.database,
        providerTransport: failingReconciliationTransport
      })
    );

    Effect.runSync(rebuildServices.voiceRebuild.schedule("user_reconcile_fail"));
    await Effect.runPromise(rebuildServices.voiceRebuild.drain("user_reconcile_fail"));

    const stored = Effect.runSync(services.database.voiceProfiles.getByUser("user_reconcile_fail"));
    expect(stored?.coreReasoningSignature).toEqual(previousCore);
    expect(stored?.argumentDevelopmentSignature).toEqual(previousDevelopment);

    const diagnostics = Effect.runSync(services.database.voiceProfileDiagnostics.getByUser("user_reconcile_fail"));
    expect(diagnostics?.pendingRebuild.reasonCode).toBe("voice_signature_reconciliation_failed");
  });
});
