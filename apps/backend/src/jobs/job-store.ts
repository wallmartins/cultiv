import { Context, Effect, Layer, Ref } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type {
  JobCreatedResponse,
  JobError,
  JobProgress,
  JobResult,
  JobStatusResponse,
  PipelineRequest,
  ExecutionVoiceMetadataView,
  ExecutionsListFilters
} from "@my-ai-orchestrator/contracts";
import { createInMemoryJobRepository, snapshotStoredJob } from "./in-memory-job-repository.js";

interface BackendJobStoreState {
  readonly jobEvents: Map<string, BackendJobEvent[]>;
  readonly listeners: Map<string, Set<JobListener>>;
}

function createBackendJobStoreState(): BackendJobStoreState {
  return {
    jobEvents: new Map(),
    listeners: new Map()
  };
}

export interface BackendJobEvent {
  readonly type: "progress" | "done" | "error";
  readonly jobId: string;
  readonly payload: JobProgress | JobResult | JobError;
  readonly occurredAt: string;
}

type JobListener = (event: BackendJobEvent) => void | Promise<void>;

export interface BackendJobStore {
  readonly createQueuedJob: (
    request: PipelineRequest,
    options?: {
      readonly createdAt?: string;
      readonly contentType?: string;
      readonly estimatedSteps?: number;
      readonly voice?: ExecutionVoiceMetadataView;
    }
  ) => JobCreatedResponse;
  readonly getJobStatus: (jobId: string) => JobStatusResponse | undefined;
  readonly listJobs: () => readonly JobStatusResponse[];
  readonly updateJobProgress: (jobId: string, progress: JobProgress, updatedAt?: string) => JobStatusResponse | undefined;
  readonly completeJob: (jobId: string, result: JobResult, completedAt?: string) => JobStatusResponse | undefined;
  readonly failJob: (jobId: string, error: JobError, completedAt?: string) => JobStatusResponse | undefined;
  readonly listJobEvents: (jobId: string) => readonly BackendJobEvent[];
  readonly subscribe: (jobId: string, listener: JobListener) => () => void;
}

export interface BackendJobStoreServiceContract {
  readonly createQueuedJob: (
    request: PipelineRequest,
    options?: {
      readonly createdAt?: string;
      readonly contentType?: string;
      readonly estimatedSteps?: number;
      readonly voice?: ExecutionVoiceMetadataView;
    }
  ) => Effect.Effect<JobCreatedResponse, DatabaseError>;
  readonly getJobStatus: (jobId: string) => Effect.Effect<JobStatusResponse | undefined, DatabaseError>;
  readonly listJobs: () => Effect.Effect<readonly JobStatusResponse[], DatabaseError>;
  readonly listJobsForUser: (
    userId: string,
    limit: number,
    offset: number,
    filters?: ExecutionsListFilters
  ) => Effect.Effect<{ readonly items: readonly JobStatusResponse[]; readonly total: number }, DatabaseError>;
  readonly claimQueuedJob: (jobId: string) => Effect.Effect<boolean, DatabaseError>;
  readonly updateJobProgress: (
    jobId: string,
    progress: JobProgress,
    updatedAt?: string
  ) => Effect.Effect<JobStatusResponse | undefined, DatabaseError>;
  readonly completeJob: (
    jobId: string,
    result: JobResult,
    completedAt?: string
  ) => Effect.Effect<JobStatusResponse | undefined, DatabaseError>;
  readonly failJob: (
    jobId: string,
    error: JobError,
    completedAt?: string
  ) => Effect.Effect<JobStatusResponse | undefined, DatabaseError>;
  readonly listJobEvents: (jobId: string) => Effect.Effect<readonly BackendJobEvent[], DatabaseError>;
  readonly subscribe: (jobId: string, listener: JobListener) => Effect.Effect<() => void, DatabaseError>;
}

export class BackendJobStoreService extends Context.Tag("BackendJobStoreService")<
  BackendJobStoreService,
  BackendJobStoreServiceContract
>() {}

export function createBackendJobStoreService(): Effect.Effect<BackendJobStoreServiceContract, never> {
  return Effect.gen(function* () {
    const jobsRef = yield* Ref.make(new Map());
    const stateRef = yield* Ref.make(createBackendJobStoreState());
    const repository = createInMemoryJobRepository(jobsRef);

    const notifyListeners = (jobId: string, event: BackendJobEvent) =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef);
        const listeners = state.listeners.get(jobId);
        if (!listeners || listeners.size === 0) {
          return;
        }

        for (const listener of listeners) {
          void Promise.resolve(listener(event)).catch(() => undefined);
        }
      });

    const appendEvent = (event: BackendJobEvent) =>
      Ref.update(stateRef, (state) => {
        const jobEvents = new Map(state.jobEvents);
        const current = jobEvents.get(event.jobId) ?? [];
        jobEvents.set(event.jobId, [...current, event]);
        return {
          ...state,
          jobEvents
        };
      });

    const publishProgress = (jobId: string, progress: JobProgress, occurredAt: string) =>
      Effect.gen(function* () {
        const event: BackendJobEvent = {
          type: "progress",
          jobId,
          payload: progress,
          occurredAt
        };
        yield* appendEvent(event);
        yield* notifyListeners(jobId, event);
      });

    return {
      createQueuedJob: (request, options = {}) =>
        Effect.gen(function* () {
          const job = yield* repository.createQueuedJob(request, options);
          const queuedProgress: JobProgress = {
            currentStep: "queued",
            stepIndex: 0,
            totalSteps: job.estimatedSteps,
            percent: 0
          };
          yield* publishProgress(job.jobId, queuedProgress, job.createdAt);

          return {
            jobId: job.jobId,
            status: "queued",
            contentType: job.contentType,
            estimatedSteps: job.estimatedSteps,
            createdAt: job.createdAt
          };
        }),
      getJobStatus: (jobId) =>
        repository.getJob(jobId).pipe(Effect.map((job) => (job ? snapshotStoredJob(job) : undefined))),
      listJobs: () =>
        repository.listJobs().pipe(Effect.map((jobs) => jobs.map(snapshotStoredJob))),
      listJobsForUser: (userId, limit, offset, filters) =>
        repository.listJobsForUser(userId, limit, offset, filters).pipe(
          Effect.map(({ items, total }) => ({
            items: items.map(snapshotStoredJob),
            total
          }))
        ),
      claimQueuedJob: (jobId) => repository.claimQueuedJob(jobId),
      updateJobProgress: (jobId, progress, updatedAt = new Date().toISOString()) =>
        Effect.gen(function* () {
          const job = yield* repository.updateJobProgress(jobId, progress, updatedAt);
          if (!job) {
            return undefined;
          }

          yield* publishProgress(jobId, progress, updatedAt);
          return snapshotStoredJob(job);
        }),
      completeJob: (jobId, result, completedAt = new Date().toISOString()) =>
        Effect.gen(function* () {
          const job = yield* repository.completeJob(jobId, result, completedAt);
          if (!job) {
            return undefined;
          }

          const event: BackendJobEvent = {
            type: "done",
            jobId,
            payload: result,
            occurredAt: completedAt
          };
          yield* appendEvent(event);
          yield* notifyListeners(jobId, event);
          return snapshotStoredJob(job);
        }),
      failJob: (jobId, error, completedAt = new Date().toISOString()) =>
        Effect.gen(function* () {
          const job = yield* repository.failJob(jobId, error, completedAt);
          if (!job) {
            return undefined;
          }

          const event: BackendJobEvent = {
            type: "error",
            jobId,
            payload: error,
            occurredAt: completedAt
          };
          yield* appendEvent(event);
          yield* notifyListeners(jobId, event);
          return snapshotStoredJob(job);
        }),
      listJobEvents: (jobId) =>
        Ref.get(stateRef).pipe(
          Effect.map((state) => state.jobEvents.get(jobId)?.slice() ?? [])
        ),
      subscribe: (jobId, listener) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) => {
            const listeners = new Map(state.listeners);
            const current = new Set(listeners.get(jobId) ?? []);
            current.add(listener);
            listeners.set(jobId, current);
            return {
              ...state,
              listeners
            };
          });

          return () => {
            void Effect.runSync(
              Ref.update(stateRef, (state) => {
                const listeners = new Map(state.listeners);
                const current = new Set(listeners.get(jobId) ?? []);
                current.delete(listener);
                if (current.size === 0) {
                  listeners.delete(jobId);
                } else {
                  listeners.set(jobId, current);
                }
                return {
                  ...state,
                  listeners
                };
              })
            );
          };
        })
    };
  });
}

export function createBackendJobStoreLayer() {
  return Layer.effect(BackendJobStoreService, createBackendJobStoreService());
}
