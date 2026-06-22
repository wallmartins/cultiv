import { createHash } from "node:crypto";
import type {
  ExecutionPlan,
  GenerationChannel,
  GenerationIntent,
  GenerationScope,
  PlannedStep,
  PlanSignature,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { pickBasePreset, resolveExpressionProfile } from "./expression.js";
import { getPreset, resolveDominantPlanSignature } from "./presets.js";
import { getRhetoricalProfile } from "./rhetorical-profiles.js";
import { gateHeavySteps, resolveWordTarget } from "./scale.js";

export interface PlanGenerationInput {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly qualityMode: QualityMode;
}

const STRUCTURE_STEP: PlannedStep = {
  name: "structure",
  skill: "structure",
  execution: "llm",
  routingProfile: "premium-llm"
};

const HOOK_STEP: PlannedStep = {
  name: "hook",
  skill: "hook",
  execution: "llm",
  routingProfile: "linkedin-llm"
};

const TIGHTEN_STEP: PlannedStep = {
  name: "tighten",
  skill: "tighten",
  execution: "llm",
  routingProfile: "default-llm"
};

function cloneSteps(steps: readonly PlannedStep[]): PlannedStep[] {
  return steps.map((step) => ({ ...step }));
}

function insertBeforeDraft(steps: PlannedStep[], stepToInsert: PlannedStep): PlannedStep[] {
  if (steps.some((step) => step.name === stepToInsert.name)) {
    return steps;
  }

  const draftIndex = steps.findIndex((step) => step.name === "draft");
  if (draftIndex === -1) {
    return [...steps, stepToInsert];
  }

  return [...steps.slice(0, draftIndex), stepToInsert, ...steps.slice(draftIndex)];
}

function insertBeforeSanitize(steps: PlannedStep[], stepToInsert: PlannedStep): PlannedStep[] {
  if (steps.some((step) => step.name === stepToInsert.name)) {
    return steps;
  }

  const sanitizeIndex = steps.findIndex((step) => step.name === "sanitize");
  if (sanitizeIndex === -1) {
    return [...steps, stepToInsert];
  }

  return [...steps.slice(0, sanitizeIndex), stepToInsert, ...steps.slice(sanitizeIndex)];
}

function removeStep(steps: PlannedStep[], name: string): PlannedStep[] {
  return steps.filter((step) => step.name !== name);
}

function applyIntentPatches(
  steps: PlannedStep[],
  intent: GenerationIntent,
  lengthTier: GenerationScope["lengthTier"]
): PlannedStep[] {
  const rhetorical = getRhetoricalProfile(intent);
  if (!rhetorical.structureStep) {
    return steps;
  }

  if (lengthTier !== "medium" && lengthTier !== "long") {
    return steps;
  }

  return insertBeforeDraft(steps, STRUCTURE_STEP);
}

function applyChannelPatches(steps: PlannedStep[], channel: GenerationChannel): PlannedStep[] {
  switch (channel) {
    case "email":
      return insertBeforeSanitize(removeStep(steps, "hook"), TIGHTEN_STEP);
    case "professional-network":
      return insertBeforeDraft(steps, HOOK_STEP);
    case "social":
      return insertBeforeDraft(steps, HOOK_STEP);
    case "blog":
      return steps;
    case "unspecified":
      return steps;
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}

function applyScaleGates(steps: PlannedStep[], lengthTier: GenerationScope["lengthTier"]): PlannedStep[] {
  if (gateHeavySteps(lengthTier)) {
    return steps;
  }

  return steps.filter((step) => step.name !== "research" && step.name !== "outline");
}

function resolvePlanSignature(steps: readonly PlannedStep[], basePresetId: PlanSignature): PlanSignature {
  return resolveDominantPlanSignature(steps, basePresetId);
}

function createPlanId(input: PlanGenerationInput): string {
  const channel = input.scope.channel ?? "unspecified";
  const payload = `${input.intent}:${input.scope.lengthTier}:${channel}:${input.qualityMode}`;
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function planGeneration(input: PlanGenerationInput): ExecutionPlan {
  const channel = input.scope.channel ?? "unspecified";
  const { lengthTier } = input.scope;
  const basePresetId = pickBasePreset({
    intent: input.intent,
    lengthTier,
    channel: input.scope.channel
  });

  let steps = cloneSteps(getPreset(basePresetId).steps);
  steps = applyIntentPatches(steps, input.intent, lengthTier);
  steps = applyChannelPatches(steps, channel);
  steps = applyScaleGates(steps, lengthTier);

  return {
    planId: createPlanId(input),
    planSignature: resolvePlanSignature(steps, basePresetId),
    steps,
    parameters: {
      wordTarget: resolveWordTarget(lengthTier),
      expressionProfile: resolveExpressionProfile({ intent: input.intent, channel }),
      intent: input.intent,
      lengthTier
    }
  };
}
