import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  COMPOSITOR_PARITY_FIXTURES,
  COMPOSITOR_PARITY_QUALITY_MODE,
  findCompositorParityFixture
} from "../../apps/backend/scripts/compositor/parity-fixtures.js";
import { CALIBRATION_BRIEFINGS } from "../../apps/backend/scripts/calibration/briefings.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { resolveGenerationTarget } from "../../apps/backend/src/product/generation/resolve-generation-target.js";

describe("compositor parity fixtures", () => {
  it("defines six fixtures from the spec matrix with shared briefing text", () => {
    expect(COMPOSITOR_PARITY_FIXTURES).toHaveLength(6);

    for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
      expect(fixture.qualityMode).toBe(COMPOSITOR_PARITY_QUALITY_MODE);
      expect(fixture.briefing).toEqual(CALIBRATION_BRIEFINGS[fixture.intent]);
      expect(findCompositorParityFixture(fixture.id)).toBe(fixture);
    }
  });

  it("matches compositor planner expectations for every fixture", async () => {
    for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
      const plan = planGeneration({
        intent: fixture.intent,
        scope: fixture.scope,
        qualityMode: fixture.qualityMode
      });

      expect(plan.planSignature).toBe(fixture.expectedCompositorPlanSignature);
      expect(plan.parameters.expressionProfile).toBe(fixture.expectedExpressionProfile);
    }
  });

  it("records legacy content types separately from compositor plan signatures", async () => {
    for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
      const legacy = await Effect.runPromise(
        resolveGenerationTarget({
          intent: fixture.intent,
          scope: fixture.scope,
          compositorEnabled: false
        })
      );
      const compositor = await Effect.runPromise(
        resolveGenerationTarget({
          intent: fixture.intent,
          scope: fixture.scope,
          compositorEnabled: true,
          qualityMode: fixture.qualityMode
        })
      );

      expect(legacy.contentTypeId).toBe(fixture.expectedLegacyContentType);
      expect(compositor.contentTypeId).toBe(fixture.expectedCompositorPlanSignature);
      expect(compositor.compositor?.plan.planSignature).toBe(fixture.expectedCompositorPlanSignature);
    }
  });

  it("includes the hero email scenario from task 13", () => {
    const hero = findCompositorParityFixture("share-idea-medium-email");
    expect(hero).toMatchObject({
      intent: "share-idea",
      scope: { lengthTier: "medium", channel: "email" },
      expectedCompositorPlanSignature: "edition-piece"
    });
  });
});
