import { describe, expect, it } from "vitest";
import type { ExecutionPlan, PlannedStep } from "@my-ai-orchestrator/contracts";
import { applyPatchOps } from "../../apps/backend/src/product/generation/step-planner/patch-ops.js";
import { StepPlannerGuardrailError } from "../../apps/backend/src/product/generation/step-planner/guardrails.js";

function createPlan(
  steps: readonly PlannedStep[],
  lengthTier: ExecutionPlan["parameters"]["lengthTier"] = "medium"
): ExecutionPlan {
  return {
    planId: "test-plan",
    planSignature: "edition-piece",
    steps: [...steps],
    parameters: {
      wordTarget: { min: 400, max: 1200 },
      expressionProfile: "email-share-idea",
      intent: "share-idea",
      lengthTier
    }
  };
}

const baseSteps: PlannedStep[] = [
  { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
  { name: "refine", skill: "refine", execution: "llm", routingProfile: "default-llm" },
  { name: "sanitize", skill: "sanitize", execution: "local" }
];

describe("applyPatchOps", () => {
  it("removes a step by name", () => {
    const plan = createPlan([
      { name: "hook", skill: "hook", execution: "llm", routingProfile: "linkedin-llm" },
      ...baseSteps
    ]);

    const patched = applyPatchOps(plan, [{ type: "removeStep", name: "hook" }]);

    expect(patched.steps.map((step) => step.name)).toEqual(["draft", "refine", "sanitize"]);
  });

  it("inserts a step before a named step", () => {
    const plan = createPlan(baseSteps);
    const structureStep: PlannedStep = {
      name: "structure",
      skill: "structure",
      execution: "llm",
      routingProfile: "premium-llm"
    };

    const patched = applyPatchOps(plan, [{ type: "insertStep", before: "draft", step: structureStep }]);

    expect(patched.steps.map((step) => step.name)).toEqual(["structure", "draft", "refine", "sanitize"]);
  });

  it("adjusts wordTarget bounds", () => {
    const plan = createPlan(baseSteps);

    const patched = applyPatchOps(plan, [{ type: "adjustWordTarget", min: 500, max: 900 }]);

    expect(patched.parameters.wordTarget).toEqual({ min: 500, max: 900 });
  });

  it("forbids removing sanitize", () => {
    const plan = createPlan(baseSteps);

    expect(() => applyPatchOps(plan, [{ type: "removeStep", name: "sanitize" }])).toThrow(
      StepPlannerGuardrailError
    );
  });

  it("forbids inserting steps with unknown skills", () => {
    const plan = createPlan(baseSteps);

    expect(() =>
      applyPatchOps(plan, [
        {
          type: "insertStep",
          before: "draft",
          step: { name: "custom", skill: "unknown-skill", execution: "llm" }
        }
      ])
    ).toThrow(StepPlannerGuardrailError);
  });

  it("enforces max LLM steps for short tier", () => {
    const plan = createPlan(
      [
        { name: "hook", skill: "hook", execution: "llm", routingProfile: "linkedin-llm" },
        { name: "draft", skill: "draft", execution: "llm", routingProfile: "default-llm" },
        { name: "refine", skill: "refine", execution: "llm", routingProfile: "default-llm" },
        { name: "tighten", skill: "tighten", execution: "llm", routingProfile: "default-llm" },
        { name: "sanitize", skill: "sanitize", execution: "local" }
      ],
      "short"
    );

    expect(() => applyPatchOps(plan, [])).toThrow(StepPlannerGuardrailError);
  });
});
