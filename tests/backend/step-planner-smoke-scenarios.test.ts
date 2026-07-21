import { describe, expect, it } from "vitest";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { patchExecutionPlan } from "../../apps/backend/src/product/generation/step-planner/step-planner.js";
import { formatPatchOp } from "../../apps/backend/src/product/generation/step-planner/format-patch-op.js";
import { STEP_PLANNER_SMOKE_SCENARIOS } from "../../apps/backend/scripts/step-planner/smoke-scenarios.js";

describe("step planner smoke scenarios", () => {
  it("dry-run expectations match planner output for all curated scenarios", () => {
    for (const scenario of STEP_PLANNER_SMOKE_SCENARIOS) {
      const basePlan = planGeneration({
        rhetoricalMode: scenario.fixture.rhetoricalMode,
        scope: scenario.fixture.scope,
        qualityMode: scenario.fixture.qualityMode
      });
      const patched = patchExecutionPlan(basePlan, scenario.briefing);
      const ops = patched.ops.map(formatPatchOp);

      expect(patched.ops.length, scenario.id).toBe(scenario.expectPatchCount);
      expect(ops.sort(), scenario.id).toEqual([...scenario.expectOps].sort());
      expect(patched.plan.planSignature, scenario.id).toBe(scenario.expectFinalPlanSignature);
    }
  });
});
