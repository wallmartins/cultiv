import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BackendConfig } from "../config/config.js";
import type { BackendProviderTransport } from "../execution/pipeline/provider-transport.js";
import type { ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import { processQueuedJob } from "./worker-job.js";
import type { BackendMemoryBundle } from "../memory/memory.js";
import type { BackendProductServices } from "../product.js";
import { Effect } from "effect";
type JobProgress = import("@my-ai-orchestrator/contracts").JobProgress;
type JobStatusResponse = import("@my-ai-orchestrator/contracts").JobStatusResponse;
type JobResult = import("@my-ai-orchestrator/contracts").JobResult;
type JobError = import("@my-ai-orchestrator/contracts").JobError;

export interface BackendQueuedJob {
  readonly jobId: string;
  readonly request: PipelineRequest;
  readonly plan: OrchestrationPlan;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
  readonly creditReservationId?: string;
}

export interface BackendJobWorkerOptions {
  readonly config: BackendConfig;
  readonly jobStore: {
    readonly updateJobProgress: (jobId: string, progress: JobProgress, updatedAt?: string) => Effect.Effect<JobStatusResponse | undefined, never>;
    readonly completeJob: (jobId: string, result: JobResult, completedAt?: string) => Effect.Effect<JobStatusResponse | undefined, never>;
    readonly failJob: (jobId: string, error: JobError, completedAt?: string) => Effect.Effect<JobStatusResponse | undefined, never>;
  };
  readonly logger?: AppLogger;
  readonly now: () => Date;
  readonly memory?: BackendMemoryBundle;
  readonly services: BackendProductServices;
  readonly providerTransport?: BackendProviderTransport;
}

export interface BackendJobWorker {
  readonly enqueue: (job: BackendQueuedJob) => void;
}

export function createBackendJobWorker(options: BackendJobWorkerOptions): BackendJobWorker {
  return {
    enqueue(job) {
      queueMicrotask(() => {
        void processQueuedJob(options, job);
      });
    }
  };
}
