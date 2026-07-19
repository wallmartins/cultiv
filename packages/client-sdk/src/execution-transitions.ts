import type {
  ExecutionCancelledPayload,
  ExecutionSseEvent,
  ExecutionStatusView,
  ExecutionTransition,
  JobError,
  JobProgress,
  JobResult
} from "@my-ai-orchestrator/contracts";

export function mapSseEventToTransition(executionId: string, event: ExecutionSseEvent): ExecutionTransition | undefined {
  if (event.type === "progress") {
    const progress = event.payload as JobProgress;
    if (progress.percent === 0) {
      return {
        type: "started",
        executionId,
        progress,
        occurredAt: event.occurredAt
      };
    }

    return {
      type: "progressed",
      executionId,
      progress,
      occurredAt: event.occurredAt
    };
  }

  if (event.type === "done") {
    return {
      type: "completed",
      executionId,
      result: event.payload as JobResult,
      occurredAt: event.occurredAt
    };
  }

  if (event.type === "cancelled") {
    const cancelled = event.payload as ExecutionCancelledPayload;
    return {
      type: "cancelled",
      executionId,
      reason: cancelled.reason,
      occurredAt: event.occurredAt
    };
  }

  return {
    type: "failed",
    executionId,
    error: event.payload as JobError,
    occurredAt: event.occurredAt
  };
}

export function mapStatusSnapshotToTransitions(
  executionId: string,
  previous: ExecutionStatusView | undefined,
  current: ExecutionStatusView,
  occurredAt: string
): readonly ExecutionTransition[] {
  const transitions: ExecutionTransition[] = [];

  if (current.status === "done" && current.result) {
    transitions.push({
      type: "completed",
      executionId,
      snapshot: current,
      result: current.result,
      occurredAt
    });
    return transitions;
  }

  if (current.status === "failed" && current.error) {
    transitions.push({
      type: "failed",
      executionId,
      snapshot: current,
      error: current.error,
      occurredAt
    });
    return transitions;
  }

  if (current.status === "cancelled") {
    transitions.push({
      type: "cancelled",
      executionId,
      snapshot: current,
      occurredAt
    });
    return transitions;
  }

  if (current.progress) {
    const isFirstProgress = !previous?.progress;
    const progressChanged =
      !previous?.progress ||
      previous.progress.percent !== current.progress.percent ||
      previous.progress.currentStep !== current.progress.currentStep;

    if (isFirstProgress && current.progress.percent === 0) {
      transitions.push({
        type: "started",
        executionId,
        snapshot: current,
        progress: current.progress,
        occurredAt
      });
    } else if (progressChanged) {
      transitions.push({
        type: "progressed",
        executionId,
        snapshot: current,
        progress: current.progress,
        occurredAt
      });
    }
  }

  return transitions;
}
