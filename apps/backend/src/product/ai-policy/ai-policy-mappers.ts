import type { PipelineStepDefinition } from "@my-ai-orchestrator/contracts";
import type { OrchestrationCatalog } from "@my-ai-orchestrator/orchestrator";
import type {
  AIPolicyRoutingProfileDefinition,
  AIPolicyContentTypeDefinition,
  AIPolicyPipelineDefinition,
  ResolvedAIPolicyVersion
} from "./ai-policy-types.js";
import type { ResolvedVersionDocument } from "./ai-policy-loader.js";

export function toResolvedAIPolicyVersion(document: ResolvedVersionDocument): ResolvedAIPolicyVersion {
  const contentTypes = Object.fromEntries(
    document.catalog.contentTypes.map((contentType) => [contentType.id, contentType] as const)
  ) as Readonly<Record<string, AIPolicyContentTypeDefinition>>;
  const pipelines = Object.fromEntries(
    document.catalog.pipelines.map((pipeline) => [pipeline.pipelineType, pipeline] as const)
  ) as Readonly<Record<AIPolicyPipelineDefinition["pipelineType"], AIPolicyPipelineDefinition>>;
  const routingProfiles = Object.fromEntries(
    document.catalog.routingProfiles.map((profile) => [profile.id, profile] as const)
  ) as Readonly<Record<string, AIPolicyRoutingProfileDefinition>>;

  return {
    version: document.version,
    lifecycle: document.lifecycle,
    contentTypes,
    catalog: pipelines,
    routingProfiles,
    orchestrationCatalog: {
      pipelines: Object.fromEntries(
        document.catalog.pipelines.map((pipeline) => [
          pipeline.pipelineType,
          {
            name: pipeline.pipelineType,
            steps: pipeline.steps.map((step) => toPipelineStepDefinition(step, routingProfiles))
          }
        ] as const)
      ) as unknown as OrchestrationCatalog["pipelines"],
      contentTypes: Object.fromEntries(
        document.catalog.contentTypes.map((contentType) => [
          contentType.id,
          {
            id: contentType.id,
            label: contentType.label,
            steps: pipelines[contentType.pipelineType].steps.map((step) => step.name),
            defaultLanguage: contentType.defaultLanguage,
            inputSchema: {}
          }
        ] as const)
      ) as unknown as OrchestrationCatalog["contentTypes"],
      defaultLanguageByPipeline: Object.fromEntries(
        document.catalog.pipelines.map((pipeline) => [pipeline.pipelineType, pipeline.defaultLanguage] as const)
      ) as unknown as OrchestrationCatalog["defaultLanguageByPipeline"],
      defaultQualityModeByPipeline: Object.fromEntries(
        document.catalog.pipelines.map((pipeline) => [pipeline.pipelineType, pipeline.defaultQualityMode] as const)
      ) as unknown as OrchestrationCatalog["defaultQualityModeByPipeline"]
    }
  };
}

function toPipelineStepDefinition(
  step: AIPolicyPipelineDefinition["steps"][number],
  routingProfiles: Readonly<Record<string, AIPolicyRoutingProfileDefinition>>
): PipelineStepDefinition {
  const routingProfile = step.routingProfile ? routingProfiles[step.routingProfile] : undefined;
  const attempts = routingProfile
    ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts]
    : [];
  const config = {
    executionType: step.execution,
    ...(step.routingProfile ? { routingProfile: step.routingProfile } : {}),
    ...(step.routingProfile
      ? {
          resolvedProviderModelPlan: attempts.map((attempt) => ({
              provider: attempt.provider,
              model: attempt.model,
              ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
            })),
          routingConstraints: {
            fallbackOn: routingProfile?.operationalConstraints.fallbackOn ?? []
          }
        }
      : {}),
    ...(step.override ? { executionOverride: step.override } : {})
  };

  return {
    name: step.name,
    skill: step.skill,
    config
  };
}
