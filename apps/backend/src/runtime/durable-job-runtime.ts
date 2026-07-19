import { randomUUID } from "node:crypto";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { Redis } from "ioredis";
import type {
  JobCreatedResponse,
  JobError,
  JobProgress,
  JobResult,
  JobStatusResponse,
  PipelineRequest,
  ExecutionVoiceMetadataView
} from "@my-ai-orchestrator/contracts";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { BackendConfig } from "../config/config.js";
import type { ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import type { BackendJobEvent, BackendJobStoreServiceContract } from "../jobs/job-store.js";
import {
  resolveContentType,
  resolveEstimatedSteps,
  toJobStatusResponse
} from "../jobs/job-status-mappers.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { reloadBillingRepositoryForUserInto } from "../infra/durable-store.js";
import { appendPersistedExecutionEvent, listPersistedExecutionEvents } from "./execution-events.js";
import { closeExecutionEventSubscriber, subscribeExecutionEvents } from "./execution-events.js";
import { persistContentType } from "../product/catalog/persistence-content-types.js";
import { releaseBackendExecutionCredits, resolveBackendBillingIdentity } from "../execution/billing.js";
import { createExecutionFailure } from "../execution/pipeline/execution-failure.js";
import { BackendExecutionFailedError } from "../http/errors.js";
import type { ExecutionQueue } from "./execution-queue.js";
import {
  buildEnqueueCreatedResponse,
  buildEnqueueProgressEvent,
  resolveEnqueueEstimatedSteps,
  runExecutionEnqueueTransaction,
  type ExecutionRuntimePayload
} from "./execution-enqueue-transaction.js";

export type { ExecutionRuntimePayload, ExecutionJobDocument } from "./execution-enqueue-transaction.js";

function readRuntimePayload(record: import("@my-ai-orchestrator/database").JobRecord): ExecutionRuntimePayload | undefined {
  const historyPayload = record.history.find((entry) => entry.type === "created")?.payload;
  if (historyPayload && typeof historyPayload === "object" && "runtime" in historyPayload) {
    return (historyPayload as { runtime: ExecutionRuntimePayload }).runtime;
  }

  return undefined;
}

export interface DurableJobRuntimeOptions {
  readonly config: BackendConfig;
  readonly database: DatabaseClient;
  readonly postgres: Kysely<DatabaseTables>;
  readonly redis: Redis;
  readonly billing: BillingServiceContract;
  readonly billingRepository: import("@my-ai-orchestrator/payments").BillingRepository;
  readonly now: () => Date;
  readonly queue?: ExecutionQueue;
  readonly logger?: AppLogger;
}

export type DurableJobRuntime = BackendJobStoreServiceContract & {
  readonly enqueueAtomic: (
    request: PipelineRequest,
    input: {
      readonly plan: OrchestrationPlan;
      readonly voice?: ExecutionVoiceMetadataView;
      readonly pricingEnvelope?: ResolvedPricingEnvelope;
      readonly simulateCredits?: boolean;
    }
  ) => Effect.Effect<JobCreatedResponse, BackendExecutionFailedError>;
  readonly getRuntimePayload: (executionId: string) => Effect.Effect<ExecutionRuntimePayload | undefined, DatabaseError>;
};

export function createDurableJobRuntime(options: DurableJobRuntimeOptions): DurableJobRuntime {
  const publish = (event: BackendJobEvent) =>
    Effect.tryPromise({
      try: () => appendPersistedExecutionEvent(options.redis, event),
      catch: () => undefined
    }).pipe(Effect.asVoid, Effect.catchAll(() => Effect.void));

  const enqueueAtomic = (
    request: PipelineRequest,
    input: {
      readonly plan: OrchestrationPlan;
      readonly voice?: ExecutionVoiceMetadataView;
      readonly pricingEnvelope?: ResolvedPricingEnvelope;
      readonly simulateCredits?: boolean;
    }
  ) =>
    Effect.gen(function* () {
      const createdAt = options.now().toISOString();
      const jobId = randomUUID();
      const estimatedSteps = resolveEnqueueEstimatedSteps(input.plan);
      const billingIdentity = resolveBackendBillingIdentity(
        request,
        options.billing,
        options.config,
        `generation:${input.plan.pipeline.name}:${input.plan.request.idempotencyKey ?? jobId}`
      );

      yield* Effect.tryPromise({
        try: () =>
          runExecutionEnqueueTransaction(
            {
              postgres: options.postgres,
              billingRepository: options.billingRepository,
              billing: options.billing,
              config: options.config
            },
            {
              request,
              plan: input.plan,
              voice: input.voice,
              pricingEnvelope: input.pricingEnvelope,
              simulateCredits: input.simulateCredits,
              jobId,
              createdAt,
              billingIdentity
            }
          ),
        catch: (error) =>
          createExecutionFailure({
            message: error instanceof Error ? error.message : String(error),
            reason: "unexpected_execution_failure"
          })
      }).pipe(
        Effect.tapError(() =>
          reloadBillingRepositoryForUserInto(
            options.postgres,
            options.billingRepository,
            billingIdentity.userId
          ).pipe(Effect.catchAll(() => Effect.void))
        )
      );

      yield* persistContentType(options.database, input.plan, createdAt).pipe(Effect.catchAll(() => Effect.void));

      yield* publish(buildEnqueueProgressEvent(jobId, estimatedSteps, createdAt));

      return buildEnqueueCreatedResponse({
        jobId,
        plan: input.plan,
        estimatedSteps,
        createdAt
      });
    });

  return {
    enqueueAtomic,
    getRuntimePayload(executionId) {
      return options.database.jobs.findById(executionId).pipe(
        Effect.map((record) => (record ? readRuntimePayload(record) : undefined))
      );
    },
    createQueuedJob(request, enqueueOptions = {}) {
      return Effect.gen(function* () {
        const createdAt = enqueueOptions.createdAt ?? options.now().toISOString();
        const jobId = randomUUID();
        const userId =
          typeof request === "object" && request !== null && "userId" in request && typeof request.userId === "string"
            ? request.userId
            : "anonymous";
        const contentType = enqueueOptions.contentType ?? resolveContentType(request, "unknown");
        const estimatedSteps = enqueueOptions.estimatedSteps ?? resolveEstimatedSteps(request, 1);
        const queuedProgress: JobProgress = {
          currentStep: "queued",
          stepIndex: 0,
          totalSteps: estimatedSteps,
          percent: 0
        };

        yield* options.database.jobs.create(
          {
            id: jobId,
            userId,
            status: "queued",
            executionMode: "async",
            contentType,
            createdAt,
            completedAt: null
          },
          {
            progress: queuedProgress,
            updatedAt: createdAt,
            history: [
              {
                type: "created",
                at: createdAt,
                payload: {
                  runtime: {
                    userId,
                    request,
                    estimatedSteps,
                    voice: enqueueOptions.voice
                  } satisfies ExecutionRuntimePayload
                }
              }
            ]
          }
        );

        const event: BackendJobEvent = {
          type: "progress",
          jobId,
          payload: queuedProgress,
          occurredAt: createdAt
        };
        yield* publish(event);

        return {
          jobId,
          status: "queued",
          contentType,
          estimatedSteps,
          createdAt
        } satisfies JobCreatedResponse;
      }).pipe(Effect.orDie);
    },
    getJobStatus(jobId) {
      return options.database.jobs.findById(jobId).pipe(
        Effect.map((record) => (record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined))
      );
    },
    listJobs() {
      return options.database.jobs.list().pipe(
        Effect.map((records) =>
          records
            .map((record) => toJobStatusResponse(record, readRuntimePayload(record)))
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        )
      );
    },
    listJobsForUser(userId, limit, offset, filters) {
      return Effect.gen(function* () {
        const [records, total] = yield* Effect.all([
          options.database.jobs.listByUser(userId, limit, offset, filters),
          options.database.jobs.countByUser(userId, filters)
        ]);

        return {
          items: records.map((record) => toJobStatusResponse(record, readRuntimePayload(record))),
          total
        };
      });
    },
    claimQueuedJob(jobId) {
      return Effect.gen(function* () {
        const record = yield* options.database.jobs.findById(jobId);
        if (!record || record.status !== "queued") {
          return false;
        }

        yield* options.database.jobs.recordProgress(
          jobId,
          record.progress ?? {
            currentStep: "running",
            stepIndex: 0,
            totalSteps: 1,
            percent: 0
          },
          options.now().toISOString()
        );

        return true;
      }).pipe(Effect.catchAll(() => Effect.succeed(false)));
    },
    updateJobProgress(jobId, progress, updatedAt = options.now().toISOString()) {
      return Effect.gen(function* () {
        yield* options.database.jobs.recordProgress(jobId, progress, updatedAt);
        const record = yield* options.database.jobs.findById(jobId);
        const event: BackendJobEvent = {
          type: "progress",
          jobId,
          payload: progress,
          occurredAt: updatedAt
        };
        yield* publish(event);
        return record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined;
      }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    },
    completeJob(jobId, result, completedAt = options.now().toISOString()) {
      return Effect.gen(function* () {
        const before = yield* options.database.jobs.findById(jobId);
        if (!before) {
          return undefined;
        }

        // a cancelled job must not be resurrected — database.jobs.complete() already no-ops the
        // status for a terminal job, but without this pre-check we'd still emit a stray "done" SSE.
        const wasActive = before.status === "queued" || before.status === "running";
        yield* options.database.jobs.complete(jobId, result, completedAt);
        const record = yield* options.database.jobs.findById(jobId);
        if (record && wasActive) {
          const event: BackendJobEvent = {
            type: "done",
            jobId,
            payload: result,
            occurredAt: completedAt
          };
          yield* publish(event);
        }
        return record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined;
      }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    },
    failJob(jobId, error, completedAt = options.now().toISOString()) {
      return Effect.gen(function* () {
        const before = yield* options.database.jobs.findById(jobId);
        if (!before) {
          return undefined;
        }

        // same guard as completeJob() — an already-terminal job must not emit a stray "error" SSE.
        const wasActive = before.status === "queued" || before.status === "running";
        yield* options.database.jobs.fail(jobId, error, completedAt);
        const record = yield* options.database.jobs.findById(jobId);
        if (record && wasActive) {
          const event: BackendJobEvent = {
            type: "error",
            jobId,
            payload: error,
            occurredAt: completedAt
          };
          yield* publish(event);
        }
        return record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined;
      }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    },
    cancelJob(jobId, reason, completedAt = options.now().toISOString()) {
      return Effect.gen(function* () {
        const before = yield* options.database.jobs.findById(jobId);
        if (!before) {
          return undefined;
        }

        const wasQueued = before.status === "queued";
        const wasCancellable = before.status === "queued" || before.status === "running";

        yield* options.database.jobs.cancel(jobId, completedAt);
        const record = yield* options.database.jobs.findById(jobId);
        if (!record || !wasCancellable) {
          return record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined;
        }

        const runtime = readRuntimePayload(record);
        if (runtime?.creditReservationId) {
          // money-critical: a failed release here leaves the reservation stuck as "reserved" forever
          // (no stale-reservation sweeper exists yet) — surface it loudly instead of pretending success.
          yield* releaseBackendExecutionCredits(options.billing, runtime.creditReservationId, jobId, {
            reason: reason ?? "execution_cancelled",
            executionId: jobId
          }).pipe(
            Effect.catchAll((releaseError) =>
              Effect.sync(() =>
                options.logger?.error("Cancel-in-flight credit release failed — reservation may be leaked", {
                  jobId,
                  reservationId: runtime.creditReservationId,
                  reason: releaseError instanceof Error ? releaseError.message : String(releaseError)
                })
              )
            )
          );
        }

        if (wasQueued) {
          yield* Effect.tryPromise({
            try: () => options.queue?.remove(jobId) ?? Promise.resolve(),
            catch: () => undefined
          }).pipe(Effect.catchAll(() => Effect.void));
        }

        const event: BackendJobEvent = {
          type: "cancelled",
          jobId,
          payload: { reason, cancelledAt: completedAt },
          occurredAt: completedAt
        };
        yield* publish(event);
        return toJobStatusResponse(record, runtime);
      }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    },
    listJobEvents(jobId) {
      return Effect.tryPromise({
        try: () => listPersistedExecutionEvents(options.redis, jobId),
        catch: () => [] as BackendJobEvent[]
      }).pipe(Effect.catchAll(() => Effect.succeed([])));
    },
    subscribe(jobId, listener) {
      return Effect.sync(() => {
        const subscriber = subscribeExecutionEvents(options.redis, jobId, listener);
        return () => {
          closeExecutionEventSubscriber(subscriber, jobId);
        };
      });
    }
  };
}
