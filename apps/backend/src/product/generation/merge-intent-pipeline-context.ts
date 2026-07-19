import type { CompositorMetadata, ExecutionPlan } from "@my-ai-orchestrator/contracts";
import type { ResolvedGenerationIntent } from "./intent-resolver.js";
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

export function mergeIntentPipelineContext(
  requestContext: Record<string, unknown> | undefined,
  resolvedIntent: ResolvedGenerationIntent | undefined,
  compositorPlan?: ExecutionPlan,
  stepPlanner?: StepPlannerTelemetry
): Record<string, unknown> | undefined {
  const compositorMetadata = compositorPlan ? toCompositorMetadata(compositorPlan) : undefined;
  const plannerMetadata = stepPlanner
    ? {
        patchCount: stepPlanner.patchCount,
        ops: [...stepPlanner.ops],
        basePlanSignature: stepPlanner.basePlanSignature,
        finalPlanSignature: stepPlanner.finalPlanSignature
      }
    : undefined;

  if (!resolvedIntent) {
    if (!compositorMetadata && !plannerMetadata) {
      return requestContext;
    }

    return {
      ...requestContext,
      ...(compositorMetadata ? { [PIPELINE_METADATA_KEYS.compositor]: compositorMetadata } : {}),
      ...(plannerMetadata ? { [PIPELINE_METADATA_KEYS.stepPlanner]: plannerMetadata } : {})
    };
  }

  return {
    ...requestContext,
    wordTarget: resolvedIntent.wordTarget,
    lengthTier: resolvedIntent.scope.lengthTier,
    [PIPELINE_METADATA_KEYS.generationIntent]: resolvedIntent.intent,
    generationChannel: resolvedIntent.channelHint,
    ...(compositorMetadata ? { [PIPELINE_METADATA_KEYS.compositor]: compositorMetadata } : {}),
    ...(plannerMetadata ? { [PIPELINE_METADATA_KEYS.stepPlanner]: plannerMetadata } : {})
  };
}
