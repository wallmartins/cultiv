import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeGenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import { createExecutionTelemetry } from "../../apps/backend";
import { mergeCompositorPipelineContext } from "../../apps/backend/src/product/generation/merge-compositor-pipeline-context.js";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";
import {
  backendAppTestStartedAt,
  createBackendAppTestApp,
  createBackendAppTestConfig,
  createBackendAppTestServices
} from "./backend-app.fixtures.js";

describe("step planner execution integration", () => {
  it("patches promote plans for minimal briefings but not heavy ones with a question", async () => {
    const minimal = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "promote",
        scope: { lengthTier: "short", channel: "social" },
        stepPlannerEnabled: true,
        briefing: { topic: "Community update" },
        qualityMode: "balanced"
      })
    );
    const heavy = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "promote",
        scope: { lengthTier: "short", channel: "social" },
        stepPlannerEnabled: true,
        briefing: {
          topic: "Monorepos atrasam times pequenos?",
          question: "Você já viu monorepo acelerar ou travar seu time?"
        },
        qualityMode: "balanced"
      })
    );

    expect(minimal.stepPlanner?.patchCount).toBe(1);
    expect(heavy.stepPlanner?.patchCount).toBe(0);
    expect(minimal.compositor?.plan.steps.map((step) => step.name)).not.toContain("hook");
    expect(heavy.compositor?.plan.steps.map((step) => step.name)).toContain("hook");
    expect(minimal.compositor?.plan.planSignature).toBe("short-piece");
    expect(heavy.compositor?.plan.planSignature).toBe("short-piece");
  });

  it("returns preview pricing keyed to the final patched planSignature", async () => {
    const config = createBackendAppTestConfig({
      billingUserId: "user_step_planner_preview",
      compositorV1Enabled: true,
      stepPlannerV1Enabled: true
    });
    const services = createBackendAppTestServices(config);

    services.billing.upsertSubscription({
      id: "sub_user_step_planner_preview_pro",
      userId: "user_step_planner_preview",
      planId: "pro",
      status: "active",
      startedAt: backendAppTestStartedAt.toISOString()
    });

    const app = createBackendAppTestApp(config, services);
    const response = await app.request("/api/generation-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rhetoricalMode: "argue",
        scope: { lengthTier: "medium" },
        briefing: {
          decision: "Adopt immutable snapshots",
          systemContext: "x".repeat(401)
        }
      })
    });

    expect(response.status).toBe(200);

    const decoded = await Effect.runPromise(decodeGenerationPreviewResponse(await response.json()));

    expect(decoded.compositor?.planSignature).toBe("edition-piece");
    expect(decoded.pricingSnapshot.contentType).toBe("edition-piece");
  });

  it("carries step planner metadata from merge context into execution telemetry", () => {
    const resolved = Effect.runSync(
      resolveGenerationTarget({
        rhetoricalMode: "promote",
        scope: { lengthTier: "short", channel: "social" },
        stepPlannerEnabled: true,
        briefing: { topic: "Community update" },
        qualityMode: "balanced"
      })
    );

    const context = mergeCompositorPipelineContext(
      undefined,
      resolved.compositor.plan,
      "social",
      resolved.stepPlanner
    );

    const telemetry = createExecutionTelemetry({
      executedCount: 3,
      maxLLMCalls: 4,
      request: {
        pipeline: resolved.compositor.pipeline,
        inputs: {},
        context
      }
    });

    expect(telemetry.planner).toMatchObject({
      patchCount: 1,
      basePlanSignature: "short-piece",
      finalPlanSignature: "short-piece"
    });
    expect(telemetry.planner?.ops).toEqual(["removeStep:hook"]);
  });
});
