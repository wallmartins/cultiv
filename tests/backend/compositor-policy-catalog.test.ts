import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { getPreset } from "../../apps/backend/src/product/generation/compositor/presets.js";
import { materializeCompositorPipeline } from "../../apps/backend/src/product/generation/compositor/plan-materializer.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";

const baseConfig: BackendConfig = {
  environment: "test",
  executionMode: "sync",
  qualityMode: "balanced",
  defaultLanguage: "pt-BR",
  serviceName: "backend",
  host: "127.0.0.1",
  port: 3000,
  version: "0.1.0"
};

describe("compositor policy catalog", () => {
  it("loads compositor pipeline entries in the active policy catalog", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));
    const policy = Effect.runSync(services.aiPolicy.getActivePolicy());

    for (const presetId of ["short-piece", "long-piece", "serial-piece", "edition-piece"] as const) {
      expect(policy.catalog[presetId]?.steps.map((step) => step.name)).toEqual(
        getPreset(presetId).steps.map((step) => step.name)
      );
    }
  });

  it("keeps compositor presets out of the user-facing orchestration catalog", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));
    const orchestrationCatalog = services.aiPolicy.getActiveOrchestrationCatalog();
    const userFacingIds = Object.keys(orchestrationCatalog.contentTypes);

    expect(userFacingIds).not.toContain("short-piece");
    expect(userFacingIds).not.toContain("long-piece");
    expect(userFacingIds).not.toContain("serial-piece");
    expect(userFacingIds).not.toContain("edition-piece");
    expect(userFacingIds).toHaveLength(6);
  });

  it("resolves execution snapshot for ExplicitPipelineRequest with edition-piece", () => {
    const services = Effect.runSync(createBackendProductServices(baseConfig));
    const plan = planGeneration({
      intent: "share-idea",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced"
    });
    const pipeline = materializeCompositorPipeline(plan);

    const snapshot = Effect.runSync(
      services.aiPolicy.resolveExecutionSnapshot({
        request: {
          pipeline,
          inputs: {
            briefing: { topic: "Compositor policy routing" },
            wordTarget: plan.parameters.wordTarget,
            expressionProfile: plan.parameters.expressionProfile
          },
          context: {
            compositor: {
              planId: plan.planId,
              planSignature: plan.planSignature,
              expressionProfile: plan.parameters.expressionProfile,
              lengthTier: plan.parameters.lengthTier,
              wordTarget: plan.parameters.wordTarget
            }
          },
          language: "pt-BR",
          qualityMode: "balanced"
        },
        planTier: "pro",
        executionMode: "sync",
        qualityMode: "balanced",
        defaultLanguage: "pt-BR"
      })
    );

    expect(snapshot.plan.pipeline.name).toBe("edition-piece");
    expect(snapshot.steps.map((step) => step.name)).toEqual(
      getPreset("edition-piece").steps.map((step) => step.name)
    );
    expect(snapshot.pricingEnvelope.planSignature).toBe("edition-piece");
    expect(snapshot.pricingEnvelope.lengthTier).toBe("medium");
  });
});
