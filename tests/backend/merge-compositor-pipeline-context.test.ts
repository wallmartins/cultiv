import { describe, expect, it } from "vitest";
import type { ExecutionPlan } from "@my-ai-orchestrator/contracts";
import { mergeCompositorPipelineContext } from "../../apps/backend/src/product/generation/merge-compositor-pipeline-context.js";

const shortPlan: ExecutionPlan = {
  planId: "plan-short",
  planSignature: "short-piece",
  steps: [{ name: "draft", skill: "draft", execution: "llm" }],
  parameters: {
    wordTarget: { min: 150, max: 400 },
    expressionProfile: "professional-expound",
    rhetoricalMode: "expound",
    lengthTier: "short"
  }
};

const editionPlan: ExecutionPlan = {
  planId: "plan-test",
  planSignature: "edition-piece",
  steps: [{ name: "draft", skill: "draft", execution: "llm" }],
  parameters: {
    wordTarget: { min: 400, max: 1200 },
    expressionProfile: "email-expound",
    rhetoricalMode: "expound",
    lengthTier: "medium"
  }
};

describe("mergeCompositorPipelineContext", () => {
  it("merges wordTarget and rhetorical mode metadata into pipeline context", () => {
    const merged = mergeCompositorPipelineContext(
      { existing: "value" },
      shortPlan,
      "professional-network"
    );

    expect(merged).toEqual({
      existing: "value",
      wordTarget: { min: 150, max: 400 },
      lengthTier: "short",
      rhetoricalMode: "expound",
      generationChannel: "professional-network",
      compositor: {
        planId: "plan-short",
        planSignature: "short-piece",
        expressionProfile: "professional-expound",
        lengthTier: "short",
        wordTarget: { min: 150, max: 400 }
      }
    });
  });

  it("defaults to an empty request context when none is provided", () => {
    const merged = mergeCompositorPipelineContext(undefined, shortPlan, "professional-network");

    expect(merged).toEqual({
      wordTarget: { min: 150, max: 400 },
      lengthTier: "short",
      rhetoricalMode: "expound",
      generationChannel: "professional-network",
      compositor: {
        planId: "plan-short",
        planSignature: "short-piece",
        expressionProfile: "professional-expound",
        lengthTier: "short",
        wordTarget: { min: 150, max: 400 }
      }
    });
  });

  it("merges compositor metadata and step planner telemetry when provided", () => {
    const merged = mergeCompositorPipelineContext(
      { existing: "value" },
      editionPlan,
      "email",
      {
        patchCount: 1,
        ops: ["removeStep:hook"],
        basePlanSignature: "short-piece",
        finalPlanSignature: "edition-piece"
      }
    );

    expect(merged).toEqual({
      existing: "value",
      wordTarget: { min: 400, max: 1200 },
      lengthTier: "medium",
      rhetoricalMode: "expound",
      generationChannel: "email",
      compositor: {
        planId: "plan-test",
        planSignature: "edition-piece",
        expressionProfile: "email-expound",
        lengthTier: "medium",
        wordTarget: { min: 400, max: 1200 }
      },
      stepPlanner: {
        patchCount: 1,
        ops: ["removeStep:hook"],
        basePlanSignature: "short-piece",
        finalPlanSignature: "edition-piece"
      }
    });
  });
});
