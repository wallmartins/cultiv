import { randomUUID } from "node:crypto";
import { Context, Effect, Layer, Ref } from "effect";
import type {
  JobCreatedResponse,
  JobError,
  JobProgress,
  JobResult,
  JobStatus,
  JobStatusResponse,
  PipelineRequest,
  ExecutionVoiceMetadataView
} from "@my-ai-orchestrator/contracts";

interface StoredJob {
  readonly jobId: string;
  readonly request: PipelineRequest;
  readonly createdAt: string;
  updatedAt: string;
  readonly contentType: string;
  readonly estimatedSteps: number;
  status: JobStatus;
  progress: JobProgress | null;
  result: JobResult | null;
  error: JobError | null;
  completedAt: string | null;
  voice: ExecutionVoiceMetadataView | null;
  readonly userId: string;
}

interface BackendJobStoreState {
  readonly jobs: Map<string, StoredJob>;
  readonly jobEvents: Map<string, BackendJobEvent[]>;
  readonly listeners: Map<string, Set<JobListener>>;
}

function createBackendJobStoreState(): BackendJobStoreState {
  return {
    jobs: new Map(),
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
  ) => Effect.Effect<JobCreatedResponse, never>;
  readonly getJobStatus: (jobId: string) => Effect.Effect<JobStatusResponse | undefined, never>;
  readonly listJobs: () => Effect.Effect<readonly JobStatusResponse[], never>;
  readonly updateJobProgress: (
    jobId: string,
    progress: JobProgress,
    updatedAt?: string
  ) => Effect.Effect<JobStatusResponse | undefined, never>;
  readonly completeJob: (
    jobId: string,
    result: JobResult,
    completedAt?: string
  ) => Effect.Effect<JobStatusResponse | undefined, never>;
  readonly failJob: (
    jobId: string,
    error: JobError,
    completedAt?: string
  ) => Effect.Effect<JobStatusResponse | undefined, never>;
  readonly listJobEvents: (jobId: string) => Effect.Effect<readonly BackendJobEvent[], never>;
  readonly subscribe: (jobId: string, listener: JobListener) => Effect.Effect<() => void, never>;
}

export class BackendJobStoreService extends Context.Tag("BackendJobStoreService")<
  BackendJobStoreService,
  BackendJobStoreServiceContract
>() {}

export function createBackendJobStoreService(): Effect.Effect<BackendJobStoreServiceContract, never> {
  return Effect.gen(function* () {
    const stateRef = yield* Ref.make(createBackendJobStoreState());

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

    return {
      createQueuedJob: (request, options = {}) =>
        Effect.gen(function* () {
          const createdAt = options.createdAt ?? new Date().toISOString();
          const jobId = randomUUID();
          const contentType = options.contentType ?? resolveContentType(request);
          const estimatedSteps = options.estimatedSteps ?? resolveEstimatedSteps(request);

          const userId = typeof request === "object" && request !== null && "userId" in request && typeof request.userId === "string"
            ? request.userId
            : "anonymous";
          const job: StoredJob = {
            jobId,
            request,
            createdAt,
            updatedAt: createdAt,
            contentType,
            estimatedSteps,
            status: "queued",
            progress: null,
            result: null,
            error: null,
            completedAt: null,
            voice: options.voice ?? null,
            userId
          };

          yield* Ref.update(stateRef, (state) => {
            const jobs = new Map(state.jobs);
            jobs.set(jobId, job);
            return {
              ...state,
              jobs
            };
          });

          const queuedProgress: JobProgress = {
            currentStep: "queued",
            stepIndex: 0,
            totalSteps: estimatedSteps,
            percent: 0
          };
          const event: BackendJobEvent = {
            type: "progress",
            jobId,
            payload: queuedProgress,
            occurredAt: createdAt
          };
          yield* appendEvent(event);
          yield* notifyListeners(jobId, event);

          return {
            jobId,
            status: "queued",
            contentType,
            estimatedSteps,
            createdAt
          };
        }),
      getJobStatus: (jobId) =>
        Ref.get(stateRef).pipe(
          Effect.map((state) => {
            const job = state.jobs.get(jobId);
            if (!job) {
              return undefined;
            }
            return snapshotJob(job);
          })
        ),
      listJobs: () =>
        Ref.get(stateRef).pipe(
          Effect.map((state) => [...state.jobs.values()].map(snapshotJob).sort((left, right) => right.createdAt.localeCompare(left.createdAt)))
        ),
      updateJobProgress: (jobId, progress, updatedAt = new Date().toISOString()) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const job = state.jobs.get(jobId);
          if (!job) {
            return undefined;
          }

          const nextJob: StoredJob = {
            ...job,
            status: "running",
            progress,
            updatedAt
          };

          yield* Ref.update(stateRef, (current) => {
            const jobs = new Map(current.jobs);
            jobs.set(jobId, nextJob);
            return {
              ...current,
              jobs
            };
          });

          const event: BackendJobEvent = {
            type: "progress",
            jobId,
            payload: progress,
            occurredAt: updatedAt
          };
          yield* appendEvent(event);
          yield* notifyListeners(jobId, event);

          return snapshotJob(nextJob);
        }),
      completeJob: (jobId, result, completedAt = new Date().toISOString()) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const job = state.jobs.get(jobId);
          if (!job) {
            return undefined;
          }

          const nextJob: StoredJob = {
            ...job,
            status: "done",
            result,
            completedAt,
            updatedAt: completedAt,
            progress: {
              currentStep: "completed",
              stepIndex: Math.max(job.estimatedSteps - 1, 0),
              totalSteps: job.estimatedSteps,
              percent: 100
            }
          };

          yield* Ref.update(stateRef, (current) => {
            const jobs = new Map(current.jobs);
            jobs.set(jobId, nextJob);
            return {
              ...current,
              jobs
            };
          });

          const event: BackendJobEvent = {
            type: "done",
            jobId,
            payload: result,
            occurredAt: completedAt
          };
          yield* appendEvent(event);
          yield* notifyListeners(jobId, event);

          return snapshotJob(nextJob);
        }),
      failJob: (jobId, error, completedAt = new Date().toISOString()) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const job = state.jobs.get(jobId);
          if (!job) {
            return undefined;
          }

          const nextJob: StoredJob = {
            ...job,
            status: "failed",
            error,
            completedAt,
            updatedAt: completedAt
          };

          yield* Ref.update(stateRef, (current) => {
            const jobs = new Map(current.jobs);
            jobs.set(jobId, nextJob);
            return {
              ...current,
              jobs
            };
          });

          const event: BackendJobEvent = {
            type: "error",
            jobId,
            payload: error,
            occurredAt: completedAt
          };
          yield* appendEvent(event);
          yield* notifyListeners(jobId, event);

          return snapshotJob(nextJob);
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

function resolveContentType(request: PipelineRequest): string {
  if ("pipeline" in request) {
    return request.pipeline.name;
  }

  return request.contentType ?? request.pipelineType;
}

function resolveEstimatedSteps(request: PipelineRequest): number {
  if ("pipeline" in request) {
    return Math.max(request.pipeline.steps.length, 1);
  }

  return 1;
}

function snapshotJob(job: StoredJob): JobStatusResponse {
  return {
    jobId: job.jobId,
    status: job.status,
    contentType: job.contentType,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    ...(job.voice ? { voice: job.voice } : {}),
    userId: job.userId
  };
}
