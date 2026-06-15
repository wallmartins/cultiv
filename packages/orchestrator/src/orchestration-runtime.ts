import { Effect } from "effect";
import { ContextManagerService, TraceRecorderService, type Pipeline } from "@my-ai-orchestrator/core";
import { SkillRegistryService } from "@my-ai-orchestrator/skills";
import { createOrchestrationLoopProgressReporter } from "./orchestration-loop-progress.js";
import { OrchestrationContextError } from "./orchestration-errors.js";
import * as OrchestrationErrors from "./orchestration-errors.js";
import {
  createOrchestrationProgress,
  completeOrchestrationProgress
} from "./progress-handler.js";
import type { OrchestratorRunOptions, OrchestrationResult } from "./orchestration-service.js";
import { runOrchestrationStep } from "./orchestration-step-runtime.js";

export interface OrchestrationRuntimeCommand {
  readonly pipeline: Pipeline;
  readonly inputs: Record<string, unknown>;
  readonly options?: OrchestratorRunOptions;
}

export function executeOrchestrationRuntime(
  command: OrchestrationRuntimeCommand
): Effect.Effect<
  OrchestrationResult,
  OrchestrationErrors.OrchestrationError,
  ContextManagerService | TraceRecorderService | SkillRegistryService
> {
  const continueOnError = command.options?.continueOnError ?? true;
  const startTime = Date.now();
  const progress = createOrchestrationProgress(
    command.pipeline.steps.length,
    command.pipeline.steps[0]?.name ?? "start"
  );
  const progressReporter = createOrchestrationLoopProgressReporter(
    command.pipeline.steps.length,
    command.pipeline.name,
    command.options?.progressHandlers
  );

  return Effect.gen(function* () {
    const ctx = yield* ContextManagerService;
    const traceRecorder = yield* TraceRecorderService;
    let hasErrors = false;

    yield* progressReporter.emitPipelineStart();

    let completedSteps = 0;

    for (let i = 0; i < command.pipeline.steps.length; i++) {
      const stepResult = yield* runOrchestrationStep({
        pipeline: command.pipeline,
        stepIndex: i,
        adapter: command.options?.adapter,
        continueOnError,
        progressReporter
      });

      if (stepResult.hasErrors) {
        hasErrors = true;
        if (!stepResult.shouldContinue) {
          const trace = yield* traceRecorder.complete("failed");
          const finalProgress = completeOrchestrationProgress(progress, "failed", i);
          const output = yield* ctx.getState();

          return {
            output,
            trace,
            progress: finalProgress,
            completedSteps: i,
            totalSteps: command.pipeline.steps.length,
            status: "failed" as const
          };
        }
      }

      completedSteps += stepResult.completedStepsDelta;
      yield* ctx.advanceStep();
    }

    const trace = yield* traceRecorder.complete(hasErrors ? "partial" : "completed");
    const durationMs = Date.now() - startTime;
    const finalProgress = completeOrchestrationProgress(
      progress,
      hasErrors ? "partial" : "completed",
      completedSteps
    );
    const output = yield* ctx.getState();

    yield* progressReporter.emitPipelineComplete(
      completedSteps,
      durationMs,
      hasErrors ? "partial" : "completed"
    );

    return {
      output,
      trace,
      progress: finalProgress,
      completedSteps,
      totalSteps: command.pipeline.steps.length,
      status: hasErrors ? ("partial" as const) : ("completed" as const)
    };
  }).pipe(
    Effect.mapError((error: unknown) => {
      if (
        error &&
        typeof error === "object" &&
        "_tag" in error &&
        typeof error._tag === "string" &&
        error._tag.startsWith("Orchestration")
      ) {
        return error as OrchestrationErrors.OrchestrationError;
      }

      return new OrchestrationContextError({
        operation: "executeOrchestrationRuntime",
        message: String(error)
      });
    })
  );
}
