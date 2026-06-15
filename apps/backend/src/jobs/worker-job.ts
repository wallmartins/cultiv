import { Effect } from "effect";
import type { BackendJobWorkerOptions, BackendQueuedJob } from "./worker.js";
import { executeSyncRun } from "../execution/runtime.js";

export async function processQueuedJob(options: BackendJobWorkerOptions, job: BackendQueuedJob): Promise<void> {
  try {
    const result = await Effect.runPromise(
      executeSyncRun({
        plan: job.plan,
        request: job.request,
        pricingEnvelope: job.pricingEnvelope,
        config: options.config,
        now: options.now,
        includeTrace: Boolean("includeTrace" in job.request && job.request.includeTrace),
        services: options.services,
        providerTransport: options.providerTransport,
        memory: options.memory?.memory,
        corpus: options.memory?.corpus,
        simulateCredits: job.simulateCredits,
        existingCreditReservationId: job.creditReservationId,
        onProgress: (progress) => publishJobProgress(options, job.jobId, progress)
      })
    );

    await Effect.runPromise(
      completeQueuedJob(options, job.jobId, {
        content: result.content,
        metadata: {
          mode: result.mode,
          adapter: result.adapter,
          model: result.model,
          qualityMode: result.qualityMode,
          telemetry: result.telemetry,
          billing: result.telemetry?.billing,
          voice: result.voice
        }
      })
    );

    options.logger?.info("Finished queued backend job", {
      jobId: job.jobId,
      pipelineName: job.plan.pipeline.name
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected_error";
    await Effect.runPromise(failQueuedJob(options, job.jobId, message));
    options.logger?.error("Queued backend job failed", {
      jobId: job.jobId,
      pipelineName: job.plan.pipeline.name,
      reason: message
    });
  }
}

function publishJobProgress(
  options: BackendJobWorkerOptions,
  jobId: string,
  progress: import("@my-ai-orchestrator/contracts").JobProgress
): Effect.Effect<void, never> {
  const updatedAt = options.now().toISOString();

  return Effect.all(
    [
      options.jobStore.updateJobProgress(jobId, progress, updatedAt),
      options.services.persistence.recordJobProgress({
        jobId,
        progress,
        updatedAt
      })
    ],
    { concurrency: "unbounded", discard: true }
  );
}

function completeQueuedJob(
  options: BackendJobWorkerOptions,
  jobId: string,
  result: import("@my-ai-orchestrator/contracts").JobResult
): Effect.Effect<void, never> {
  const completedAt = options.now().toISOString();

  return Effect.all(
    [
      options.jobStore.completeJob(jobId, result, completedAt),
      options.services.persistence.recordJobCompletion({
        jobId,
        result,
        completedAt
      })
    ],
    { concurrency: "unbounded", discard: true }
  );
}

function failQueuedJob(
  options: BackendJobWorkerOptions,
  jobId: string,
  message: string
): Effect.Effect<void, never> {
  const completedAt = options.now().toISOString();
  const error = {
    message,
    step: null
  } as const;

  return Effect.all(
    [
      options.jobStore.failJob(jobId, error, completedAt),
      options.services.persistence.recordJobFailure({
        jobId,
        error,
        completedAt
      })
    ],
    { concurrency: "unbounded", discard: true }
  );
}
