import type {
  GenerationLengthTier,
  PlanSignature
} from "@my-ai-orchestrator/contracts";
import type { ResolvedGenerationTarget } from "../generation/resolve-generation-target.js";

export interface CompositorPricingArgs {
  readonly planSignature: PlanSignature;
  readonly lengthTier: GenerationLengthTier;
}

export function resolveCompositorPricingArgs(
  resolvedTarget: ResolvedGenerationTarget
): CompositorPricingArgs {
  return {
    planSignature: resolvedTarget.compositor.plan.planSignature,
    lengthTier: resolvedTarget.compositor.plan.parameters.lengthTier
  };
}
