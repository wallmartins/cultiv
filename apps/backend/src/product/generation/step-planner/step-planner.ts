import type { ExecutionPlan } from "@my-ai-orchestrator/contracts";
import type { GenerationChannel, RhetoricalMode } from "@my-ai-orchestrator/contracts";
import { pickBasePreset } from "../compositor/expression.js";
import { resolveDominantPlanSignature } from "../compositor/presets.js";
import { derivePatchOps } from "./briefing-rules.js";
import { applyPatchOps } from "./patch-ops.js";
import type { StepPlannerPatchOp } from "./types.js";

export interface PatchedExecutionPlanResult {
  readonly plan: ExecutionPlan;
  readonly ops: readonly StepPlannerPatchOp[];
  readonly basePlanSignature: ExecutionPlan["planSignature"];
}

export function patchExecutionPlan(
  basePlan: ExecutionPlan,
  briefing: string | Record<string, unknown>
): PatchedExecutionPlanResult {
  const basePlanSignature = basePlan.planSignature;
  const ops = derivePatchOps({
    briefing,
    rhetoricalMode: basePlan.parameters.rhetoricalMode,
    lengthTier: basePlan.parameters.lengthTier
  });
  const patchedStepsPlan = applyPatchOps(basePlan, ops);
  const basePresetId = pickBasePreset({
    rhetoricalMode: basePlan.parameters.rhetoricalMode,
    lengthTier: basePlan.parameters.lengthTier,
    channel: resolveChannelFromExpressionProfile(
      basePlan.parameters.expressionProfile,
      basePlan.parameters.rhetoricalMode
    )
  });

  return {
    plan: {
      ...patchedStepsPlan,
      planSignature: resolveDominantPlanSignature(patchedStepsPlan.steps, basePresetId)
    },
    ops,
    basePlanSignature
  };
}

function resolveChannelFromExpressionProfile(
  expressionProfile: string,
  rhetoricalMode: RhetoricalMode
): GenerationChannel {
  if (expressionProfile === `${rhetoricalMode}-default`) {
    return "unspecified";
  }

  if (expressionProfile.startsWith("email-")) {
    return "email";
  }

  if (expressionProfile.startsWith("professional-")) {
    return "professional-network";
  }

  if (expressionProfile.startsWith("blog-")) {
    return "blog";
  }

  if (expressionProfile.startsWith("social-")) {
    return "social";
  }

  return "unspecified";
}
