import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { createBillingService } from "@my-ai-orchestrator/payments";
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
import type { BackendConfig } from "../config/config.js";
import type { ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import type { BackendJobEvent, BackendJobStoreServiceContract } from "../jobs/job-store.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import {
  insertOutboxEvent,
  reloadBillingRepositoryInto,
  saveBillingRepositoryInTransaction
} from "../infra/durable-store.js";
import { appendPersistedExecutionEvent, listPersistedExecutionEvents } from "./execution-events.js";
import { subscribeExecutionEvents } from "./execution-events.js";
import { persistContentType } from "../product/catalog/persistence-content-types.js";
import {
  reserveBackendExecutionCredits
} from "../execution/billing.js";
import { resolveBackendBillingIdentity } from "../execution/billing.js";
import { resolveUsagePolicyModel } from "../product/usage/resolve-usage-policy-model.js";
import { createExecutionFailure } from "../execution/pipeline/execution-failure.js";
import { BackendExecutionFailedError } from "../http/errors.js";

export interface ExecutionRuntimePayload {
  readonly userId: string;
  readonly request: PipelineRequest;
  readonly plan?: OrchestrationPlan;
  readonly estimatedSteps: number;
  readonly voice?: ExecutionVoiceMetadataView;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
  readonly creditReservationId?: string;
}

export interface ExecutionJobDocument {
  readonly runtime: ExecutionRuntimePayload;
  readonly estimatedSteps: number;
}

function resolveContentType(request: PipelineRequest): string {
  if ("pipeline" in request) {
    return request.pipeline.name;
  }

  return request.contentType ?? request.pipelineType ?? "unknown";
}

function resolveEstimatedSteps(request: PipelineRequest, fallback: number): number {
  if ("pipeline" in request) {
    return Math.max(1, request.pipeline.steps.length);
  }

  return fallback;
}

function toJobStatusResponse(record: import("@my-ai-orchestrator/database").JobRecord, runtime?: ExecutionRuntimePayload): JobStatusResponse {
  return {
    jobId: record.id,
    status: record.status,
    contentType: record.contentType,
    progress: record.progress,
    result: record.result,
    error: record.error,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    voice: runtime?.voice,
    userId: runtime?.userId
  };
}

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
  readonly getRuntimePayload: (executionId: string) => Effect.Effect<ExecutionRuntimePayload | undefined, never>;
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
      const userId =
        "userId" in request && typeof request.userId === "string" ? request.userId : "anonymous";
      const estimatedSteps = Math.max(1, input.plan.pipeline.steps.length);

      const billingIdentity = resolveBackendBillingIdentity(
        request,
        options.billing,
        options.config,
        `generation:${input.plan.pipeline.name}:${input.plan.request.idempotencyKey ?? jobId}`
      );

      const runtimeBase = {
        userId,
        request,
        plan: input.plan,
        estimatedSteps,
        voice: input.voice,
        pricingEnvelope: input.pricingEnvelope,
        simulateCredits: input.simulateCredits
      } satisfies Omit<ExecutionRuntimePayload, "creditReservationId">;

      yield* Effect.tryPromise({
        try: () =>
          options.postgres.transaction().execute(async (trx) => {
            let creditReservationId: string | undefined;

            if (!input.simulateCredits) {
              const txnBilling = createBillingService({ repository: options.billingRepository });
              const reservation = await Effect.runPromise(
                reserveBackendExecutionCredits(
                  txnBilling,
                  billingIdentity,
                  input.plan.request.qualityMode,
                  Math.max(0, input.plan.pipeline.steps.length - 1),
                  input.pricingEnvelope?.creditPrice,
                  {
                    pipelineName: input.plan.pipeline.name,
                    contentType: input.plan.contentType.id,
                    adapter: request.adapter ?? options.config.serviceName,
                    model: resolveUsagePolicyModel(
                      request,
                      input.plan.request.qualityMode ?? options.config.qualityMode
                    )
                  }
                )
              );
              creditReservationId = reservation.reservationId;
              await Effect.runPromise(
                saveBillingRepositoryInTransaction(trx, options.billingRepository, createdAt)
              );
            }

            const runtime: ExecutionRuntimePayload = {
              ...runtimeBase,
              creditReservationId
            };

            const queuedProgress: JobProgress = {
              currentStep: "queued",
              stepIndex: 0,
              totalSteps: estimatedSteps,
              percent: 0
            };

            const record = {
              id: jobId,
              status: "queued" as const,
              executionMode: input.plan.request.executionMode,
              contentType: input.plan.contentType.id,
              createdAt,
              completedAt: null,
              pipelineId: input.plan.pipeline.name,
              version: 1,
              progress: queuedProgress,
              progressHistory: [],
              result: null,
              error: null,
              updatedAt: createdAt,
              history: [
                {
                  type: "created" as const,
                  at: createdAt,
                  payload: {
                    runtime,
                    contentType: input.plan.contentType.id,
                    executionMode: input.plan.request.executionMode,
                    pipelineName: input.plan.pipeline.name
                  }
                }
              ]
            };

            await trx
              .insertInto("jobs")
              .values({
                id: jobId,
                user_id: userId,
                data: JSON.stringify(record),
                version: 1,
                created_at: createdAt,
                updated_at: createdAt
              })
              .execute();

            await Effect.runPromise(
              insertOutboxEvent(trx, {
                id: randomUUID(),
                aggregateType: "execution",
                aggregateId: jobId,
                eventType: "ExecutionEnqueued",
                payload: { executionId: jobId, userId },
                occurredAt: createdAt
              })
            );
          }),
        catch: (error) =>
          createExecutionFailure({
            message: error instanceof Error ? error.message : String(error),
            reason: "unexpected_execution_failure"
          })
      }).pipe(
        Effect.tapError(() => reloadBillingRepositoryInto(options.postgres, options.billingRepository))
      );

      yield* persistContentType(options.database, input.plan, createdAt).pipe(Effect.catchAll(() => Effect.void));

      const event: BackendJobEvent = {
        type: "progress",
        jobId,
        payload: {
          currentStep: "queued",
          stepIndex: 0,
          totalSteps: estimatedSteps,
          percent: 0
        },
        occurredAt: createdAt
      };
      yield* publish(event);

      return {
        jobId,
        status: "queued",
        contentType: input.plan.contentType.id,
        estimatedSteps,
        createdAt
      } satisfies JobCreatedResponse;
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
        const contentType = enqueueOptions.contentType ?? resolveContentType(request);
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

        yield* Effect.tryPromise({
          try: () =>
            options.postgres.updateTable("jobs").set({ user_id: userId }).where("id", "=", jobId).execute(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.void));

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
      });
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
    listJobsForUser(userId, limit, offset) {
      return Effect.gen(function* () {
        const [records, total] = yield* Effect.all([
          options.database.jobs.listByUser(userId, limit, offset),
          options.database.jobs.countByUser(userId)
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
        yield* options.database.jobs.complete(jobId, result, completedAt);
        const record = yield* options.database.jobs.findById(jobId);
        const event: BackendJobEvent = {
          type: "done",
          jobId,
          payload: result,
          occurredAt: completedAt
        };
        yield* publish(event);
        return record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined;
      }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
    },
    failJob(jobId, error, completedAt = options.now().toISOString()) {
      return Effect.gen(function* () {
        yield* options.database.jobs.fail(jobId, error, completedAt);
        const record = yield* options.database.jobs.findById(jobId);
        const event: BackendJobEvent = {
          type: "error",
          jobId,
          payload: error,
          occurredAt: completedAt
        };
        yield* publish(event);
        return record ? toJobStatusResponse(record, readRuntimePayload(record)) : undefined;
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
          void subscriber.unsubscribe();
          void subscriber.quit();
        };
      });
    }
  };
}
