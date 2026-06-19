import type { ExecutionPlan, PlannedStep } from "@my-ai-orchestrator/contracts";
import {
  assertInsertableStep,
  assertPatchGuardrails,
  assertRemovableStep
} from "./guardrails.js";
import type { StepPlannerPatchOp } from "./types.js";

function cloneSteps(steps: readonly PlannedStep[]): PlannedStep[] {
  return steps.map((step) => ({ ...step }));
}

function insertBefore(steps: PlannedStep[], before: string, stepToInsert: PlannedStep): PlannedStep[] {
  if (steps.some((step) => step.name === stepToInsert.name)) {
    return steps;
  }

  const beforeIndex = steps.findIndex((step) => step.name === before);
  if (beforeIndex === -1) {
    return [...steps, stepToInsert];
  }

  return [...steps.slice(0, beforeIndex), stepToInsert, ...steps.slice(beforeIndex)];
}

function removeStep(steps: PlannedStep[], name: string): PlannedStep[] {
  return steps.filter((step) => step.name !== name);
}

export function applyPatchOps(plan: ExecutionPlan, ops: readonly StepPlannerPatchOp[]): ExecutionPlan {
  let steps = cloneSteps(plan.steps);
  let wordTarget = { ...plan.parameters.wordTarget };

  for (const op of ops) {
    switch (op.type) {
      case "insertStep":
        assertInsertableStep(op.step);
        steps = insertBefore(steps, op.before, op.step);
        break;
      case "removeStep":
        assertRemovableStep(op.name);
        steps = removeStep(steps, op.name);
        break;
      case "adjustWordTarget":
        wordTarget = { min: op.min, max: op.max };
        break;
      default: {
        const _exhaustive: never = op;
        return _exhaustive;
      }
    }
  }

  const patchedPlan: ExecutionPlan = {
    ...plan,
    steps,
    parameters: {
      ...plan.parameters,
      wordTarget
    }
  };

  assertPatchGuardrails(patchedPlan);
  return patchedPlan;
}
