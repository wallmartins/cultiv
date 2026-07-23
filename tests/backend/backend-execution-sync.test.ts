import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createBackendExecutionService } from "../../apps/backend";
import { createBackendJobStoreService } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { BackendExecutionFailedError, BackendExecutionIntegrityError, createBackendProductServices } from "../../apps/backend";
import { AIAdapterTransportError } from "@my-ai-orchestrator/ai-adapters";
import { seedExecutionVoiceState } from "./backend-app.fixtures.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { mergeCompositorPipelineContext } from "../../apps/backend/src/product/generation/merge-compositor-pipeline-context.js";

// A raw ExplicitPipelineRequest/SimplifiedPipelineRequest bypasses resolveGenerationTarget (and
// the context it populates), so pricing (size-keyed via pricesByPlan since the 2026-07-20 policy)
// needs the same compositor metadata a real /me/executions/run request would carry, and the
// pipeline's step names/skills must match the catalog's compositor preset exactly (see
// ai-policy-pipeline-validation.ts) — build both from the same plan to keep them in lockstep.
function buildSerialPieceFixture() {
  const plan = planGeneration({
    rhetoricalMode: "narrate",
    scope: { lengthTier: "medium" },
    qualityMode: "balanced"
  });
  const context = mergeCompositorPipelineContext(undefined, plan, "unspecified");
  return {
    plan,
    context,
    steps: plan.steps.map((step) => ({ name: step.name, skill: step.skill }))
  };
}

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
    const fixture = buildSerialPieceFixture();

    const response = await Effect.runPromise(
      service.execute({
        pipeline: {
          name: fixture.plan.planSignature,
          steps: fixture.steps
        },
        inputs: {
          briefing: {
            topic: "Monorepo migration",
            keyPoints: ["packages first", "backend second"]
          }
        },
        context: fixture.context,
        model: "gemini-3.1-flash-lite",
        adapter: "openai",
        idempotencyKey: "idem-billing-run",
        includeTrace: false
      })
    );

    expect(response.mode).toBe("sync");
    expect(response.pipelineName).toBe("serial-piece");
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
    const fixture = buildSerialPieceFixture();

    const snapshot = Effect.runSync(
      services.aiPolicy.resolveExecutionSnapshot({
        request: {
          userId: "backend",
          pipelineType: fixture.plan.planSignature,
          contentType: fixture.plan.planSignature,
          briefing: {
            topic: "Policy integrity"
          },
          context: fixture.context,
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
        contentType: "edition-piece"
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
    const fixture = buildSerialPieceFixture();

    const result = await Effect.runPromise(
      Effect.either(
        service.execute({
          pipeline: {
            name: fixture.plan.planSignature,
            steps: fixture.steps
          },
          inputs: {
            briefing: {
              topic: "Monorepo migration",
              keyPoints: ["packages first", "backend second"]
            }
          },
          context: fixture.context,
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
      expect(result.left.message).toContain('Pipeline "serial-piece" failed at step "analyze"');
      expect(result.left.message).toContain("simulated transport failure");
    }
  });
});
