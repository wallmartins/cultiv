import type { JobStatus } from "@my-ai-orchestrator/contracts";
import { DEFAULT_ORCHESTRATION_POLICY } from "./defaults.js";
import type {
  OrchestrationExecutionStrategy,
  OrchestrationPlan,
  OrchestrationPolicy,
  OrchestrationPolicyService,
  OrchestrationRequest,
  StepOutcome
} from "./orchestrator-types.js";
import { normalizePipelineRequest } from "./planning.js";

export function shouldContinuePipeline(outcome: StepOutcome, policy: Partial<OrchestrationPolicy> = {}): boolean {
  const resolvedPolicy = { ...DEFAULT_ORCHESTRATION_POLICY, ...policy };

  if (outcome.status === "done" || outcome.status === "running" || outcome.status === "queued") {
    return true;
  }

  return Boolean(outcome.continueOnError || resolvedPolicy.allowPartialResults);
}

export function shouldRetryStep(
  attempt: number,
  outcome: StepOutcome,
  policy: Partial<OrchestrationPolicy> = {}
): boolean {
  const resolvedPolicy = { ...DEFAULT_ORCHESTRATION_POLICY, ...policy };
  return outcome.status === "failed" && attempt < resolvedPolicy.retryLimitPerStep;
}

export function isTerminalStatus(status: JobStatus): boolean {
  return status === "done" || status === "failed";
}

export function createOrchestrationPolicyService(): OrchestrationPolicyService {
  return {
    shouldContinue: shouldContinuePipeline,
    shouldRetry: shouldRetryStep,
    isTerminalStatus
  };
}

export function selectExecutionStrategy(
  requestOrPlan: OrchestrationRequest | OrchestrationPlan,
  policy: Partial<OrchestrationPolicy> = {}
): OrchestrationExecutionStrategy {
  const resolvedPolicy = { ...DEFAULT_ORCHESTRATION_POLICY, ...policy };
  const executionMode = "executionPlan" in requestOrPlan
    ? requestOrPlan.executionPlan.mode
    : normalizePipelineRequest(requestOrPlan, { executionMode: resolvedPolicy.defaultExecutionMode }).executionMode;

  return executionMode === "async"
    ? {
        name: "AsyncStrategy",
        mode: "async",
        immediate: false
      }
    : {
        name: "SyncStrategy",
        mode: "sync",
        immediate: true
      };
}
