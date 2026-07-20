import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createBackendExecutionService } from "../../apps/backend";
import { createBackendJobStoreService } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { BackendExecutionFailedError, BackendExecutionIntegrityError, createBackendProductServices } from "../../apps/backend";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import { seedExecutionVoiceState } from "./backend-app.fixtures.js";

describe("backend execution service sync", () => {
  it("reserves and captures billing credits for a successful sync execution", async () => {
    const config: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "criador",
      billingUserId: "backend"
    };
    const services = Effect.runSync(createBackendProductServices(config, { now: () => new Date("2026-05-11T00:00:05.000Z") }));
    seedExecutionVoiceState(services, "backend");
    const jobStore = Effect.runSync(createBackendJobStoreService());
    const service = createBackendExecutionService({
      config,
      jobStore,
      services,
      now: () => new Date("2026-05-11T00:00:05.000Z")
    });

    const response = await Effect.runPromise(
      service.execute({
        pipeline: {
          name: "validation-post",
          steps: [
            { name: "analyze", skill: "analyze" },
            { name: "draft", skill: "draft" },
            { name: "refine", skill: "refine" },
            { name: "sanitize", skill: "sanitize" }
          ]
        },
        inputs: {
          briefing: {
            topic: "Monorepo migration",
            keyPoints: ["packages first", "backend second"]
          }
        },
        model: "gemini-3.1-flash-lite",
        adapter: "openai",
        idempotencyKey: "idem-billing-run",
        includeTrace: false
      })
    );

    expect(response.mode).toBe("sync");
    expect(response.pipelineName).toBe("validation-post");
    expect(response.content).toContain("Monorepo migration");

    const ledger = services.billing.listLedger("backend", "criador");
    expect(ledger.map((entry) => entry.entryType)).toEqual(["grant_cycle", "reserve", "capture"]);
    expect(services.billing.getWallet("backend", "criador")?.availableCredits).toBe(297.5);
  });

  it("fails trusted execution with integrity errors instead of recomputing policy", async () => {
    const config: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "criador",
      billingUserId: "backend"
    };
    const services = Effect.runSync(createBackendProductServices(config, { now: () => new Date("2026-05-11T00:00:05.000Z") }));
    seedExecutionVoiceState(services, "backend");
    const jobStore = Effect.runSync(createBackendJobStoreService());
    const service = createBackendExecutionService({
      config,
      jobStore,
      services,
      now: () => new Date("2026-05-11T00:00:05.000Z")
    });

    const snapshot = Effect.runSync(
      services.aiPolicy.resolveExecutionSnapshot({
        request: {
          userId: "backend",
          pipelineType: "validation-post",
          contentType: "validation-post",
          briefing: {
            topic: "Policy integrity"
          },
          qualityMode: "balanced"
        },
        planTier: "pro",
        executionMode: "sync",
        qualityMode: "balanced",
        defaultLanguage: "pt-BR"
      })
    );

    const invalidSnapshot = {
      ...snapshot,
      pricingEnvelope: {
        ...snapshot.pricingEnvelope,
        contentType: "newsletter"
      }
    } as const;

    const result = await Effect.runPromise(Effect.either(service.executeTrusted(invalidSnapshot)));

    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(BackendExecutionIntegrityError);
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("content_type_mismatch");
    }
  });

  it("returns typed execution failure with stable reason when provider attempts are exhausted", async () => {
    const config: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "criador",
      billingUserId: "backend"
    };
    const services = Effect.runSync(createBackendProductServices(config, { now: () => new Date("2026-05-11T00:00:05.000Z") }));
    seedExecutionVoiceState(services, "backend");
    const jobStore = Effect.runSync(createBackendJobStoreService());
    const service = createBackendExecutionService({
      config,
      jobStore,
      services,
      now: () => new Date("2026-05-11T00:00:05.000Z"),
      providerTransport: {
        complete: (request) =>
          Effect.fail(
            new AIAdapterTransportError({
              provider: request.provider,
              message: `simulated transport failure for ${request.provider}/${request.model}`
            })
          )
      }
    });

    const result = await Effect.runPromise(
      Effect.either(
        service.execute({
          pipeline: {
            name: "validation-post",
            steps: [
              { name: "analyze", skill: "analyze" },
              { name: "draft", skill: "draft" },
              { name: "refine", skill: "refine" },
              { name: "sanitize", skill: "sanitize" }
            ]
          },
          inputs: {
            briefing: {
              topic: "Monorepo migration",
              keyPoints: ["packages first", "backend second"]
            }
          },
          model: "gemini-3.1-flash-lite",
          adapter: "openai",
          idempotencyKey: "idem-provider-failure",
          includeTrace: false
        })
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BackendExecutionFailedError);
      expect(result.left.reason).toBe("pipeline_step_failed");
      expect(result.left.message).toContain('Pipeline "validation-post" failed at step "analyze"');
      expect(result.left.message).toContain("simulated transport failure");
    }
  });
});
