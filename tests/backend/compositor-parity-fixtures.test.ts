import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  COMPOSITOR_PARITY_FIXTURES,
  COMPOSITOR_PARITY_QUALITY_MODE,
  findCompositorParityFixture
} from "../../apps/backend/scripts/compositor/parity-fixtures.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

describe("compositor parity fixtures", () => {
  it("defines six fixtures from the spec matrix", () => {
    expect(COMPOSITOR_PARITY_FIXTURES).toHaveLength(6);

    for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
      expect(fixture.qualityMode).toBe(COMPOSITOR_PARITY_QUALITY_MODE);
      expect(Object.keys(fixture.briefing).length).toBeGreaterThan(0);
      expect(findCompositorParityFixture(fixture.id)).toBe(fixture);
    }
  });

  it("matches compositor planner expectations for every fixture", async () => {
    for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
      const plan = planGeneration({
        rhetoricalMode: fixture.rhetoricalMode,
        scope: fixture.scope,
        qualityMode: fixture.qualityMode
      });

      expect(plan.planSignature).toBe(fixture.expectedCompositorPlanSignature);
      expect(plan.parameters.expressionProfile).toBe(fixture.expectedExpressionProfile);
    }
  });

  it("resolveGenerationTarget always resolves the compositor plan signature as contentTypeId", async () => {
    for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
      const resolved = await Effect.runPromise(
        resolveGenerationTarget({
          rhetoricalMode: fixture.rhetoricalMode,
          scope: fixture.scope,
          qualityMode: fixture.qualityMode
        })
      );

      expect(resolved.contentTypeId).toBe(fixture.expectedCompositorPlanSignature);
      expect(resolved.compositor.plan.planSignature).toBe(fixture.expectedCompositorPlanSignature);
    }
  });

  it("includes the hero email scenario from task 13", () => {
    const hero = findCompositorParityFixture("share-idea-medium-email");
    expect(hero).toMatchObject({
      rhetoricalMode: "expound",
      scope: { lengthTier: "medium", channel: "email" },
      expectedCompositorPlanSignature: "edition-piece"
    });
  });
});
