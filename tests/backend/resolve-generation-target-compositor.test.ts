import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

// resolveGenerationTarget always resolves through the compositor now (Practice Profile Phase 1
// clean cut removed the legacy/compositorEnabled toggle branch) — this file exercises the
// resulting plan/pipeline shape in detail, complementing the base cases in
// resolve-generation-target.test.ts.
describe("resolveGenerationTarget compositor", () => {
  it("resolves an email-channel plan with expression profile and materialized pipeline", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "expound",
        scope: { lengthTier: "medium", channel: "email" },
        qualityMode: "balanced"
      })
    );

    expect(resolved.contentTypeId).toBe("edition-piece");
    expect(resolved.compositor.plan.planSignature).toBe("edition-piece");
    expect(resolved.compositor.plan.parameters.expressionProfile).toBe("email-expound");
    expect(resolved.compositor.pipeline.name).toBe("edition-piece");
    expect(resolved.compositor.pipeline.steps.at(-1)?.skill).toBe("sanitize");
  });

  it("resolves a short-piece plan for a professional-network scope", async () => {
    const resolved = await Effect.runPromise(
      resolveGenerationTarget({
        rhetoricalMode: "expound",
        scope: { lengthTier: "short", channel: "professional-network" }
      })
    );

    expect(resolved.contentTypeId).toBe("short-piece");
    expect(resolved.compositor.plan.planSignature).toBe("short-piece");
    expect(resolved.compositor.plan.steps.map((step) => step.name)).toContain("hook");
  });
});
