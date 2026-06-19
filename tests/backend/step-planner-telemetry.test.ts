import { describe, expect, it } from "vitest";
import { createExecutionTelemetry } from "../../apps/backend";

describe("step planner execution telemetry", () => {
  it("includes planner metadata from pipeline request context", () => {
    const telemetry = createExecutionTelemetry({
      executedCount: 4,
      maxLLMCalls: 6,
      request: {
        pipeline: { name: "short-piece", steps: [] },
        inputs: {},
        context: {
          stepPlanner: {
            patchCount: 1,
            ops: ["removeStep:hook"],
            basePlanSignature: "short-piece",
            finalPlanSignature: "short-piece"
          }
        }
      }
    });

    expect(telemetry.planner).toEqual({
      patchCount: 1,
      ops: ["removeStep:hook"],
      basePlanSignature: "short-piece",
      finalPlanSignature: "short-piece"
    });
  });

  it("omits planner metadata when step planner did not run", () => {
    const telemetry = createExecutionTelemetry({
      executedCount: 4,
      maxLLMCalls: 6,
      request: {
        pipeline: { name: "short-piece", steps: [] },
        inputs: {},
        context: {
          compositor: {
            planId: "plan-1",
            planSignature: "short-piece",
            expressionProfile: "social-engage-audience",
            lengthTier: "short",
            wordTarget: { min: 150, max: 400 }
          }
        }
      }
    });

    expect(telemetry.planner).toBeUndefined();
  });
});
