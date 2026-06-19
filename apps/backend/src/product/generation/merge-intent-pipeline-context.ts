import type { CompositorMetadata, ExecutionPlan } from "@my-ai-orchestrator/contracts";
import type { ResolvedGenerationIntent } from "./intent-resolver.js";

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
  compositorPlan?: ExecutionPlan
): Record<string, unknown> | undefined {
  const compositorMetadata = compositorPlan ? toCompositorMetadata(compositorPlan) : undefined;

  if (!resolvedIntent) {
    if (!compositorMetadata) {
      return requestContext;
    }

    return {
      ...requestContext,
      compositor: compositorMetadata
    };
  }

  return {
    ...requestContext,
    wordTarget: resolvedIntent.wordTarget,
    generationIntent: resolvedIntent.intent,
    generationChannel: resolvedIntent.channelHint,
    ...(compositorMetadata ? { compositor: compositorMetadata } : {})
  };
}
