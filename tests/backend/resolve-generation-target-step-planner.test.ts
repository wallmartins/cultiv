import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

describe("resolveGenerationTarget step planner", () => {
  it("patches compositor plan when step planner is enabled and briefing is present", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "promote",
        scope: { lengthTier: "short", channel: "social" },
        stepPlannerEnabled: true,
        briefing: { topic: "Community update" },
        qualityMode: "balanced"
      })
    );

    expect(resolved.compositor.plan.steps.map((step) => step.name)).not.toContain("hook");
    expect(resolved.contentTypeId).toBe(resolved.compositor.plan.planSignature);
  });

  it("keeps compositor-only plan when step planner is disabled", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "promote",
        scope: { lengthTier: "short", channel: "social" },
        stepPlannerEnabled: false,
        briefing: { topic: "Community update" },
        qualityMode: "balanced"
      })
    );

    expect(resolved.compositor.plan.steps.map((step) => step.name)).toContain("hook");
  });

  it("does not patch when briefing is absent even if step planner is enabled", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "promote",
        scope: { lengthTier: "short", channel: "social" },
        stepPlannerEnabled: true,
        qualityMode: "balanced"
      })
    );

    expect(resolved.compositor.plan.steps.map((step) => step.name)).toContain("hook");
  });
});
