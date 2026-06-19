import type { ExecutionPlan } from "@my-ai-orchestrator/contracts";
import type { PipelineDefinition } from "@my-ai-orchestrator/contracts";

export function materializeCompositorPipeline(plan: ExecutionPlan): PipelineDefinition {
  return {
    name: plan.planSignature,
    steps: plan.steps.map((step) => ({
      name: step.name,
      skill: step.skill,
      config: {
        executionType: step.execution,
        ...(step.routingProfile ? { routingProfile: step.routingProfile } : {})
      }
    }))
  };
}
