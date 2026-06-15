import { Context, Effect } from "effect";
import type {
  ContextManagerService,
  ExecutionAdapter,
  Pipeline,
  Trace,
  TraceRecorderService
} from "@my-ai-orchestrator/core";
import type { OrchestrationError } from "./orchestration-errors.js";
import { executeOrchestrationRuntime } from "./orchestration-runtime.js";
import type { OrchestrationProgress, OrchestrationProgressHandlers } from "./progress-handler.js";
import type { OrchestrationRequest } from "./orchestrator-types.js";
import type { SkillRegistryService } from "@my-ai-orchestrator/skills";

export interface OrchestrationResult {
  readonly output: unknown;
  readonly trace: Trace;
  readonly progress: OrchestrationProgress;
  readonly completedSteps: number;
  readonly totalSteps: number;
  readonly status: "completed" | "failed" | "partial";
}

export interface OrchestratorRunOptions {
  readonly progressHandlers?: OrchestrationProgressHandlers;
  readonly initialState?: Record<string, unknown>;
  readonly adapter?: ExecutionAdapter;
  readonly continueOnError?: boolean;
  readonly maxStepsOverride?: number;
}

export interface OrchestratorServiceContract<R = never> {
  readonly run: (
    request: OrchestrationRequest,
    options?: OrchestratorRunOptions
  ) => Effect.Effect<OrchestrationResult, OrchestrationError, R>;
  readonly runPipeline: (
    pipeline: Pipeline,
    inputs: Record<string, unknown>,
    options?: OrchestratorRunOptions
  ) => Effect.Effect<OrchestrationResult, OrchestrationError, R>;
}

export class OrchestratorServiceTag extends Context.Tag("OrchestratorService")<
  OrchestratorServiceTag,
  OrchestratorServiceContract
>() {}

export function createOrchestratorService<R = never>(
  runEffect: (
    pipeline: Pipeline,
    inputs: Record<string, unknown>,
    options?: OrchestratorRunOptions
  ) => Effect.Effect<OrchestrationResult, OrchestrationError, R>
): OrchestratorServiceContract<R> {
  return {
    run: (request, options) => {
      const pipeline = buildPipelineFromRequest(request);
      return runEffect(pipeline, extractInputsFromRequest(request), options);
    },
    runPipeline: (pipeline, inputs, options) => runEffect(pipeline, inputs, options)
  };
}

export function createRuntimeBackedOrchestratorService(): OrchestratorServiceContract<
  ContextManagerService | TraceRecorderService | SkillRegistryService
> {
  return createOrchestratorService((pipeline, inputs, options) =>
    executeOrchestrationRuntime({ pipeline, inputs, options })
  );
}

function buildPipelineFromRequest(request: OrchestrationRequest): Pipeline {
  if ("pipeline" in request) {
    return request.pipeline as Pipeline;
  }

  return {
    name: request.pipelineType ?? "default",
    steps: [],
    inputs: {}
  };
}

function extractInputsFromRequest(request: OrchestrationRequest): Record<string, unknown> {
  if ("inputs" in request && request.inputs) {
    return {
      ...request.inputs,
      ...("importedContext" in request && request.importedContext !== undefined
        ? { importedContext: request.importedContext }
        : {})
    };
  }
  if ("context" in request && request.context) {
    return request.context;
  }
  return {};
}
