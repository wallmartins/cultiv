import { Effect } from "effect";
import type {
  PipelineDefinition,
  PipelineRequest,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import { createContentType, createExecutionPlan, type ContentType } from "@my-ai-orchestrator/domain";
import type { QualityLane, QualityLaneStrategy } from "@my-ai-orchestrator/text-quality";
import { createFallbackContentType, createFallbackPipelineType } from "./catalog.js";
import { DEFAULT_ORCHESTRATION_CATALOG, DEFAULT_ORCHESTRATION_POLICY } from "./defaults.js";
import type {
  BuildOrchestrationPlanOptions,
  NormalizedOrchestrationRequest,
  OrchestrationCatalog,
  OrchestrationPlan,
  OrchestrationPlanner,
  OrchestrationPolicy,
  OrchestrationRequest,
  OrchestrationStepProgress,
  QualityLanePlanOptions
} from "./orchestrator-types.js";

function isExplicitPipelineRequest(
  request: OrchestrationRequest
): request is import("@my-ai-orchestrator/contracts").ExplicitPipelineRequest {
  return "pipeline" in request;
}

export function normalizePipelineRequest(
  request: OrchestrationRequest,
  options: Partial<BuildOrchestrationPlanOptions> = {}
): NormalizedOrchestrationRequest {
  const catalog = options.catalog ?? DEFAULT_ORCHESTRATION_CATALOG;
  const executionMode = options.executionMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultExecutionMode;
  const qualityMode = options.qualityMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultQualityMode;
  const defaultLanguage = options.defaultLanguage ?? DEFAULT_ORCHESTRATION_POLICY.defaultLanguage;
  const pipelineType = createFallbackPipelineType(request);
  const pipeline = resolvePipelineDefinition(request, catalog);
  const contentTypeId = "contentType" in request && request.contentType ? request.contentType : pipeline.name;
  const resolvedLanguage =
    "language" in request && request.language
      ? request.language
      : pipelineType
        ? catalog.defaultLanguageByPipeline[pipelineType] ?? defaultLanguage
        : defaultLanguage;
  const resolvedQualityMode =
    "qualityMode" in request && request.qualityMode
      ? request.qualityMode
      : pipelineType
        ? catalog.defaultQualityModeByPipeline[pipelineType] ?? qualityMode
        : qualityMode;
  let input: Readonly<Record<string, unknown>>;
  if (isExplicitPipelineRequest(request)) {
    input = {
      ...(request.inputs ?? {}),
      ...(request.importedContext !== undefined ? { importedContext: request.importedContext } : {})
    };
  } else if (typeof request.briefing === "object") {
    input = request.briefing;
  } else {
    input = { briefing: request.briefing };
  }

  return {
    variant: isExplicitPipelineRequest(request) ? "explicit" : "simplified",
    pipelineType,
    pipelineName: pipeline.name,
    contentTypeId,
    language: resolvedLanguage,
    qualityMode: resolvedQualityMode,
    executionMode,
    idempotencyKey: "idempotencyKey" in request && request.idempotencyKey ? request.idempotencyKey : null,
    input,
    pipeline
  };
}

export function resolvePipelineDefinition(
  request: OrchestrationRequest,
  catalog: OrchestrationCatalog = DEFAULT_ORCHESTRATION_CATALOG
): PipelineDefinition {
  if (isExplicitPipelineRequest(request)) {
    return request.pipeline;
  }

  return catalog.pipelines[request.pipelineType];
}

export function resolveContentType(
  request: OrchestrationRequest,
  catalog: OrchestrationCatalog = DEFAULT_ORCHESTRATION_CATALOG
): ContentType {
  const normalized = normalizePipelineRequest(request, { catalog });
  const definition = catalog.contentTypes[normalized.contentTypeId] ?? createFallbackContentType(
    normalized.contentTypeId,
    normalized.pipeline,
    normalized.language
  );

  return createContentType({
    id: definition.id,
    label: definition.label,
    defaultLanguage: definition.defaultLanguage,
    steps: [...definition.steps],
    inputSchema: definition.inputSchema
  });
}

export function estimateStepCount(pipeline: PipelineDefinition): number {
  return pipeline.steps.length;
}

export function calculateProgressPercent(completedSteps: number, totalSteps: number): number {
  if (totalSteps <= 0) {
    return 0;
  }

  const boundedCompletedSteps = Math.max(0, Math.min(completedSteps, totalSteps));
  return Math.round((boundedCompletedSteps / totalSteps) * 100);
}

export function buildStepProgress(pipeline: PipelineDefinition): readonly OrchestrationStepProgress[] {
  const totalSteps = pipeline.steps.length;

  return pipeline.steps.map((step, index) => ({
    stepName: step.name,
    stepIndex: index,
    totalSteps,
    percent: calculateProgressPercent(index + 1, totalSteps),
    status: index === 0 ? "running" : "pending",
    skill: step.skill
  }));
}

export function buildOrchestrationPlan(
  request: OrchestrationRequest,
  options: Partial<BuildOrchestrationPlanOptions> = {}
): OrchestrationPlan {
  const catalog = options.catalog ?? DEFAULT_ORCHESTRATION_CATALOG;
  const normalized = normalizePipelineRequest(request, {
    catalog,
    executionMode: options.executionMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultExecutionMode,
    qualityMode: options.qualityMode ?? DEFAULT_ORCHESTRATION_POLICY.defaultQualityMode,
    defaultLanguage: options.defaultLanguage ?? DEFAULT_ORCHESTRATION_POLICY.defaultLanguage
  });
  const contentType = resolveContentType(request, catalog);
  const executionPlan = createExecutionPlan({
    id: normalized.contentTypeId,
    pipeline: normalized.pipeline,
    input: normalized.input,
    mode: normalized.executionMode,
    qualityMode: normalized.qualityMode
  });
  const estimatedSteps = estimateStepCount(normalized.pipeline);
  const qualityLanes = buildQualityLanes(normalized.pipeline, {
    laneCount: normalized.qualityMode === "strict" ? 3 : normalized.qualityMode === "balanced" ? 2 : 1,
    adapter: normalized.executionMode === "async" ? "backend-async" : "backend-sync",
    model: `${normalized.contentTypeId}-${normalized.qualityMode}`
  });

  return {
    request: normalized,
    pipelineType: normalized.pipelineType,
    pipeline: normalized.pipeline,
    contentType,
    executionPlan,
    estimatedSteps,
    progress: {
      currentStep: normalized.pipeline.steps[0]?.name ?? "queued",
      stepIndex: 0,
      totalSteps: estimatedSteps,
      percent: 0
    },
    stepProgress: buildStepProgress(normalized.pipeline),
    qualityLanes
  };
}

export function buildQualityLanes(
  pipeline: PipelineDefinition,
  options: QualityLanePlanOptions
): readonly QualityLane[] {
  const laneCount = Math.max(1, Math.min(options.laneCount ?? 1, 3));
  const baseTemperature = options.baseTemperature ?? 0.4;
  const strategies: readonly QualityLaneStrategy[] = ["conservative", "balanced", "creative"];

  return Array.from({ length: laneCount }, (_, index) => {
    const strategy = strategies[index] ?? "balanced";
    return {
      laneId: `${pipeline.name}:lane:${index + 1}`,
      adapter: options.adapter,
      model: `${options.model}:${strategy}`,
      temperature: clampTemperature(baseTemperature + index * 0.2),
      strategy,
      generate: () =>
        Effect.succeed(
          [
            `Pipeline: ${pipeline.name}`,
            `Lane: ${index + 1}`,
            `Strategy: ${strategy}`,
            `Focus: preserve user voice, remove LLM tone, keep fidelity`
          ].join("\n")
        )
    };
  });
}

export function createOrchestrationPlanner(
  catalog: OrchestrationCatalog = DEFAULT_ORCHESTRATION_CATALOG,
  policy: Partial<OrchestrationPolicy> = {}
): OrchestrationPlanner {
  const resolvedPolicy = { ...DEFAULT_ORCHESTRATION_POLICY, ...policy };

  return {
    normalizeRequest: (request, options) =>
      normalizePipelineRequest(request, {
        catalog,
        executionMode: options?.executionMode ?? resolvedPolicy.defaultExecutionMode,
        qualityMode: options?.qualityMode ?? resolvedPolicy.defaultQualityMode,
        defaultLanguage: options?.defaultLanguage ?? resolvedPolicy.defaultLanguage
      }),
    resolvePipelineDefinition: (request, catalogOverride) => resolvePipelineDefinition(request, catalogOverride ?? catalog),
    resolveContentType: (request, catalogOverride) => resolveContentType(request, catalogOverride ?? catalog),
    estimateStepCount,
    buildPlan: (request, options) =>
      buildOrchestrationPlan(request, {
        catalog,
        executionMode: options?.executionMode ?? resolvedPolicy.defaultExecutionMode,
        qualityMode: options?.qualityMode ?? resolvedPolicy.defaultQualityMode,
        defaultLanguage: options?.defaultLanguage ?? resolvedPolicy.defaultLanguage
      })
  };
}

function clampTemperature(value: number): number {
  return Math.max(0, Math.min(1, value));
}
