import { Effect } from "effect";
import type {
  JobError,
  JobProgress,
  JobResult,
  PipelineRequest
} from "@my-ai-orchestrator/contracts";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";

export interface BackendPersistence {
  readonly recordExecutionPlan: (plan: OrchestrationPlan) => Effect.Effect<void, never>;
  readonly recordQueuedJob: (args: {
    readonly jobId: string;
    readonly request: PipelineRequest;
    readonly plan: OrchestrationPlan;
    readonly createdAt: string;
  }) => Effect.Effect<void, never>;
  readonly recordJobProgress: (args: {
    readonly jobId: string;
    readonly progress: JobProgress;
    readonly updatedAt: string;
  }) => Effect.Effect<void, never>;
  readonly recordJobCompletion: (args: {
    readonly jobId: string;
    readonly result: JobResult;
    readonly completedAt: string;
  }) => Effect.Effect<void, never>;
  readonly recordJobFailure: (args: {
    readonly jobId: string;
    readonly error: JobError;
    readonly completedAt: string;
  }) => Effect.Effect<void, never>;
  readonly recordMemoryWrite: (args: {
    readonly key: string;
    readonly value: unknown;
    readonly at: string;
  }) => Effect.Effect<void, never>;
}
