import { Effect } from "effect";
import {
  createOrchestrationStepCompleteProgress,
  createOrchestrationStepErrorProgress,
  createOrchestrationStepStartProgress,
  runProgressHandler,
  type OrchestrationProgressHandlers
} from "./progress-handler.js";

export interface OrchestrationLoopProgressReporter {
  readonly emitPipelineStart: () => Effect.Effect<void, never>;
  readonly emitStepStart: (stepName: string, stepIndex: number, skillName: string) => Effect.Effect<void, never>;
  readonly emitStepError: (
    stepName: string,
    stepIndex: number,
    skillName: string,
    error: {
      readonly message: string;
      readonly type: string;
      readonly stack?: string;
    }
  ) => Effect.Effect<void, never>;
  readonly emitStepComplete: (
    stepName: string,
    stepIndex: number,
    skillName: string,
    durationMs: number,
    status: "done" | "failed"
  ) => Effect.Effect<void, never>;
  readonly emitPipelineComplete: (
    completedSteps: number,
    durationMs: number,
    status: "completed" | "failed" | "partial"
  ) => Effect.Effect<void, never>;
}

export function createOrchestrationLoopProgressReporter(
  totalSteps: number,
  pipelineName: string,
  handlers?: OrchestrationProgressHandlers
): OrchestrationLoopProgressReporter {
  return {
    emitPipelineStart: () =>
      handlers?.onPipelineStart
        ? runProgressHandler(handlers.onPipelineStart(totalSteps, pipelineName))
        : Effect.void,
    emitStepStart: (stepName, stepIndex, skillName) =>
      handlers?.onStepStart
        ? runProgressHandler(
            handlers.onStepStart(
              createOrchestrationStepStartProgress(totalSteps, stepName, stepIndex, skillName)
            )
          )
        : Effect.void,
    emitStepError: (stepName, stepIndex, skillName, error) =>
      handlers?.onStepError
        ? runProgressHandler(
            handlers.onStepError(
              createOrchestrationStepErrorProgress(totalSteps, stepName, stepIndex, skillName, error)
            )
          )
        : Effect.void,
    emitStepComplete: (stepName, stepIndex, skillName, durationMs, status) =>
      handlers?.onStepComplete
        ? runProgressHandler(
            handlers.onStepComplete(
              createOrchestrationStepCompleteProgress(
                totalSteps,
                stepName,
                stepIndex,
                skillName,
                durationMs,
                status
              )
            )
          )
        : Effect.void,
    emitPipelineComplete: (completedSteps, durationMs, status) =>
      handlers?.onPipelineComplete
        ? runProgressHandler(handlers.onPipelineComplete(totalSteps, completedSteps, durationMs, status))
        : Effect.void
  };
}
