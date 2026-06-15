import { Effect } from "effect";
import type { StepProgress, StepCompleteProgress, StepErrorProgress, ProgressCallbacks } from "@my-ai-orchestrator/core";
import { calculateProgressPercent } from "./planning.js";
import type {
  OrchestrationStepCompleteProgress,
  OrchestrationStepErrorProgress,
  OrchestrationStepProgress,
  OrchestrationStepStartProgress,
  OrchestrationStepStatus
} from "./orchestrator-types.js";

export interface OrchestrationProgressHandlers {
  readonly onStepStart?: (progress: OrchestrationStepStartProgress) => void | Effect.Effect<void, never>;
  readonly onStepComplete?: (progress: OrchestrationStepCompleteProgress) => void | Effect.Effect<void, never>;
  readonly onStepError?: (progress: OrchestrationStepErrorProgress) => void | Effect.Effect<void, never>;
  readonly onPipelineStart?: (totalSteps: number, pipelineName: string) => void | Effect.Effect<void, never>;
  readonly onPipelineComplete?: (
    totalSteps: number,
    completedSteps: number,
    durationMs: number,
    status: "completed" | "failed" | "partial"
  ) => void | Effect.Effect<void, never>;
}

export interface OrchestrationProgress {
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly currentStepName: string;
  readonly percent: number;
  readonly status: "running" | "completed" | "failed" | "partial";
}

export function createOrchestrationProgress(
  totalSteps: number,
  initialStepName: string
): OrchestrationProgress {
  return {
    currentStepIndex: 0,
    totalSteps,
    currentStepName: initialStepName,
    percent: 0,
    status: "running"
  };
}

export function updateOrchestrationProgress(
  progress: OrchestrationProgress,
  stepIndex: number,
  stepName: string
): OrchestrationProgress {
  return {
    ...progress,
    currentStepIndex: stepIndex,
    currentStepName: stepName,
    percent: Math.round((stepIndex / progress.totalSteps) * 100)
  };
}

export function completeOrchestrationProgress(
  progress: OrchestrationProgress,
  status: "completed" | "failed" | "partial",
  completedSteps: number
): OrchestrationProgress {
  return {
    ...progress,
    currentStepIndex: completedSteps,
    percent: 100,
    status
  };
}

export function toOrchestrationStepProgress(
  progress: OrchestrationProgress,
  stepIndex: number,
  skillName: string,
  status: OrchestrationStepStatus
): OrchestrationStepProgress {
  return {
    stepName: progress.currentStepName,
    stepIndex,
    totalSteps: progress.totalSteps,
    percent: progress.percent,
    status,
    skill: skillName
  };
}

export function createOrchestrationStepStartProgress(
  totalSteps: number,
  stepName: string,
  stepIndex: number,
  skillName: string
): OrchestrationStepStartProgress {
  return {
    stepName,
    stepIndex,
    totalSteps,
    percent: calculateProgressPercent(stepIndex, totalSteps),
    status: "running",
    skill: skillName
  };
}

export function createOrchestrationStepCompleteProgress(
  totalSteps: number,
  stepName: string,
  stepIndex: number,
  skillName: string,
  durationMs: number,
  status: "done" | "failed"
): OrchestrationStepCompleteProgress {
  return {
    stepName,
    stepIndex,
    totalSteps,
    percent: calculateProgressPercent(stepIndex, totalSteps),
    status,
    skill: skillName,
    durationMs
  };
}

export function createOrchestrationStepErrorProgress(
  totalSteps: number,
  stepName: string,
  stepIndex: number,
  skillName: string,
  error: OrchestrationStepErrorProgress["error"]
): OrchestrationStepErrorProgress {
  return {
    stepName,
    stepIndex,
    totalSteps,
    percent: calculateProgressPercent(stepIndex, totalSteps),
    status: "failed",
    skill: skillName,
    error
  };
}

export function toLegacyProgressCallbacks(
  handlers: OrchestrationProgressHandlers
): ProgressCallbacks | undefined {
  if (!handlers.onStepStart && !handlers.onStepComplete && !handlers.onStepError) {
    return undefined;
  }

  return {
    onStepStart: (progress: StepProgress) => {
      if (handlers.onStepStart) {
        return runProgressHandler(
          handlers.onStepStart(
            createOrchestrationStepStartProgress(progress.stepIndex + 1, progress.stepName, progress.stepIndex, "")
          )
        );
      }
    },
    onStepComplete: (progress: StepCompleteProgress) => {
      if (handlers.onStepComplete) {
        return runProgressHandler(
          handlers.onStepComplete(
            createOrchestrationStepCompleteProgress(
              progress.stepIndex + 1,
              progress.stepName,
              progress.stepIndex,
              "",
              progress.durationMs,
              progress.status === "completed" ? "done" : "failed"
            )
          )
        );
      }
    },
    onStepError: (progress: StepErrorProgress) => {
      if (handlers.onStepError) {
        return runProgressHandler(
          handlers.onStepError(
            createOrchestrationStepErrorProgress(progress.stepIndex + 1, progress.stepName, progress.stepIndex, "", {
              message: progress.error.message,
              type: progress.error.type,
              stack: progress.error.stack
            })
          )
        );
      }
    }
  };
}

export function runProgressHandler(
  result: void | Effect.Effect<void, never>
): Effect.Effect<void, never> {
  return Effect.isEffect(result) ? result : Effect.void;
}
