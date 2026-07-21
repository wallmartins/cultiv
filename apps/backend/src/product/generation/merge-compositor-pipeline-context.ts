import type { CompositorMetadata, ExecutionPlan, GenerationChannel } from "@my-ai-orchestrator/contracts";
import type { StepPlannerTelemetry } from "./resolve-generation-target.js";
import { PIPELINE_METADATA_KEYS } from "../../execution/pipeline-metadata.js";

function toCompositorMetadata(plan: ExecutionPlan): CompositorMetadata {
  return {
    planId: plan.planId,
    planSignature: plan.planSignature,
    expressionProfile: plan.parameters.expressionProfile,
    lengthTier: plan.parameters.lengthTier,
    wordTarget: plan.parameters.wordTarget
  };
}

export function mergeCompositorPipelineContext(
  requestContext: Record<string, unknown> | undefined,
  compositorPlan: ExecutionPlan,
  channel: GenerationChannel,
  stepPlanner?: StepPlannerTelemetry
): Record<string, unknown> {
  const plannerMetadata = stepPlanner
    ? {
        patchCount: stepPlanner.patchCount,
        ops: [...stepPlanner.ops],
        basePlanSignature: stepPlanner.basePlanSignature,
        finalPlanSignature: stepPlanner.finalPlanSignature
      }
    : undefined;

  return {
    ...requestContext,
    wordTarget: compositorPlan.parameters.wordTarget,
    lengthTier: compositorPlan.parameters.lengthTier,
    [PIPELINE_METADATA_KEYS.rhetoricalMode]: compositorPlan.parameters.rhetoricalMode,
    generationChannel: channel,
    [PIPELINE_METADATA_KEYS.compositor]: toCompositorMetadata(compositorPlan),
    ...(plannerMetadata ? { [PIPELINE_METADATA_KEYS.stepPlanner]: plannerMetadata } : {})
  };
}
