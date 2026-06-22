import type { ExecutionPlan, GenerationLengthTier, PlannedStep } from "@my-ai-orchestrator/contracts";
import { COMPOSITOR_PRESETS } from "../compositor/presets.js";

export class StepPlannerGuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StepPlannerGuardrailError";
  }
}

const MAX_LLM_STEPS_BY_TIER: Record<GenerationLengthTier, number> = {
  short: 3,
  medium: 4,
  long: 6
};

const KNOWN_SKILLS = new Set(
  Object.values(COMPOSITOR_PRESETS).flatMap((preset) => preset.steps.map((step) => step.skill))
);

KNOWN_SKILLS.add("structure");

export function assertPatchGuardrails(plan: ExecutionPlan): void {
  if (!plan.steps.some((step) => step.name === "sanitize")) {
    throw new StepPlannerGuardrailError("sanitize step must remain in the execution plan");
  }

  for (const step of plan.steps) {
    if (!KNOWN_SKILLS.has(step.skill)) {
      throw new StepPlannerGuardrailError(`Unknown skill "${step.skill}" is not allowed in step planner patches`);
    }
  }

  const llmStepCount = plan.steps.filter((step) => step.execution === "llm").length;
  const maxLlmSteps = MAX_LLM_STEPS_BY_TIER[plan.parameters.lengthTier];

  if (llmStepCount > maxLlmSteps) {
    throw new StepPlannerGuardrailError(
      `Execution plan exceeds max LLM steps for ${plan.parameters.lengthTier} tier (${llmStepCount} > ${maxLlmSteps})`
    );
  }
}

export function assertRemovableStep(name: string): void {
  if (name === "sanitize") {
    throw new StepPlannerGuardrailError("sanitize step cannot be removed");
  }
}

export function assertInsertableStep(step: PlannedStep): void {
  if (!KNOWN_SKILLS.has(step.skill)) {
    throw new StepPlannerGuardrailError(`Unknown skill "${step.skill}" is not allowed in step planner patches`);
  }
}
