import { selectExecutionStrategy } from "./orchestration-policy.js";
import type { JobCoordinator } from "./orchestrator-types.js";

export function createJobCoordinator(): JobCoordinator {
  return {
    selectStrategy: selectExecutionStrategy,
    createJob: (plan, options = {}) => {
      const now = options.createdAt ?? new Date().toISOString();
      return {
        id: options.jobId ?? plan.executionPlan.id,
        status: "queued",
        strategy: selectExecutionStrategy(plan),
        plan,
        progress: plan.progress,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        result: null,
        error: null
      };
    },
    startJob: (job, startedAt = new Date().toISOString()) => ({
      ...job,
      status: "running",
      updatedAt: startedAt,
      progress: {
        ...job.progress,
        currentStep: job.plan.pipeline.steps[0]?.name ?? job.progress.currentStep,
        stepIndex: 0,
        totalSteps: job.plan.estimatedSteps,
        percent: 0
      }
    }),
    updateProgress: (job, progress, updatedAt = new Date().toISOString()) => ({
      ...job,
      updatedAt,
      progress
    }),
    completeJob: (job, result, completedAt = new Date().toISOString()) => ({
      ...job,
      status: "done",
      updatedAt: completedAt,
      completedAt,
      result,
      error: null,
      progress: {
        ...job.progress,
        currentStep: job.plan.pipeline.steps.at(-1)?.name ?? job.progress.currentStep,
        stepIndex: Math.max(job.plan.estimatedSteps - 1, 0),
        totalSteps: job.plan.estimatedSteps,
        percent: 100
      }
    }),
    failJob: (job, error, completedAt = new Date().toISOString()) => ({
      ...job,
      status: "failed",
      updatedAt: completedAt,
      completedAt,
      result: null,
      error,
      progress: {
        ...job.progress
      }
    })
  };
}
