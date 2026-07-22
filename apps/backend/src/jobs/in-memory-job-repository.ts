import { randomUUID } from "node:crypto";
import { Effect, Ref } from "effect";
import type {
  JobError,
  JobProgress,
  JobResult,
  JobStatus,
  JobStatusResponse,
  PipelineRequest,
  ExecutionVoiceMetadataView
} from "@my-ai-orchestrator/contracts";
import { matchesExecutionsListFilters, resolveExecutionPresentation, type ExecutionsListFilters } from "@my-ai-orchestrator/contracts";
import { isTerminalJobStatus } from "@my-ai-orchestrator/domain";
import { resolveContentType, resolveEstimatedSteps } from "./job-status-mappers.js";

export interface StoredJob {
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

export interface InMemoryJobRepository {
  readonly createQueuedJob: (
    request: PipelineRequest,
    options?: {
      readonly createdAt?: string;
      readonly contentType?: string;
      readonly estimatedSteps?: number;
      readonly voice?: ExecutionVoiceMetadataView;
    }
  ) => Effect.Effect<StoredJob, never>;
  readonly getJob: (jobId: string) => Effect.Effect<StoredJob | undefined, never>;
  readonly listJobs: () => Effect.Effect<readonly StoredJob[], never>;
  readonly listJobsForUser: (
    userId: string,
    limit: number,
    offset: number,
    filters?: ExecutionsListFilters
  ) => Effect.Effect<{ readonly items: readonly StoredJob[]; readonly total: number }, never>;
  readonly claimQueuedJob: (jobId: string) => Effect.Effect<boolean, never>;
  readonly updateJobProgress: (
    jobId: string,
    progress: JobProgress,
    updatedAt?: string
  ) => Effect.Effect<StoredJob | undefined, never>;
  readonly completeJob: (
    jobId: string,
    result: JobResult,
    completedAt?: string
  ) => Effect.Effect<StoredJob | undefined, never>;
  readonly failJob: (
    jobId: string,
    error: JobError,
    completedAt?: string
  ) => Effect.Effect<StoredJob | undefined, never>;
  // guard queued|running — cancelling an already-terminal job is a no-op, not an error.
  readonly cancelJob: (
    jobId: string,
    completedAt?: string
  ) => Effect.Effect<StoredJob | undefined, never>;
}

function resolveUserId(request: PipelineRequest): string {
  return typeof request === "object" && request !== null && "userId" in request && typeof request.userId === "string"
    ? request.userId
    : "anonymous";
}

export function snapshotStoredJob(job: StoredJob): JobStatusResponse {
  const presentation = resolveExecutionPresentation(job.request, job.contentType);

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
    userId: job.userId,
    ...presentation
  };
}

export function createInMemoryJobRepository(
  jobsRef: Ref.Ref<Map<string, StoredJob>>
): InMemoryJobRepository {
  return {
    createQueuedJob: (request, options = {}) =>
      Effect.gen(function* () {
        const createdAt = options.createdAt ?? new Date().toISOString();
        const jobId = randomUUID();
        const contentType = options.contentType ?? resolveContentType(request);
        const estimatedSteps = options.estimatedSteps ?? resolveEstimatedSteps(request);

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
          userId: resolveUserId(request)
        };

        yield* Ref.update(jobsRef, (jobs) => {
          const next = new Map(jobs);
          next.set(jobId, job);
          return next;
        });

        return job;
      }),
    getJob: (jobId) => Ref.get(jobsRef).pipe(Effect.map((jobs) => jobs.get(jobId))),
    listJobs: () =>
      Ref.get(jobsRef).pipe(
        Effect.map((jobs) =>
          [...jobs.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        )
      ),
    listJobsForUser: (userId, limit, offset, filters) =>
      Ref.get(jobsRef).pipe(
        Effect.map((jobs) => {
          const items = [...jobs.values()]
            .filter((job) => job.userId === userId)
            .filter((job) => {
              if (!filters) {
                return true;
              }

              const presentation = resolveExecutionPresentation(job.request, job.contentType);
              return matchesExecutionsListFilters(
                {
                  createdAt: job.createdAt,
                  status: job.status,
                  ...presentation
                },
                filters
              );
            })
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
          return {
            items: items.slice(offset, offset + limit),
            total: items.length
          };
        })
      ),
    claimQueuedJob: (jobId) =>
      Effect.gen(function* () {
        const jobs = yield* Ref.get(jobsRef);
        const job = jobs.get(jobId);
        if (!job || job.status !== "queued") {
          return false;
        }

        const nextJob: StoredJob = {
          ...job,
          status: "running",
          updatedAt: new Date().toISOString()
        };

        yield* Ref.update(jobsRef, (current) => {
          const next = new Map(current);
          next.set(jobId, nextJob);
          return next;
        });

        return true;
      }),
    updateJobProgress: (jobId, progress, updatedAt = new Date().toISOString()) =>
      Effect.gen(function* () {
        const jobs = yield* Ref.get(jobsRef);
        const job = jobs.get(jobId);
        if (!job) {
          return undefined;
        }

        const nextJob: StoredJob = {
          ...job,
          status: "running",
          progress,
          updatedAt
        };

        yield* Ref.update(jobsRef, (current) => {
          const next = new Map(current);
          next.set(jobId, nextJob);
          return next;
        });

        return nextJob;
      }),
    completeJob: (jobId, result, completedAt = new Date().toISOString()) =>
      Effect.gen(function* () {
        const jobs = yield* Ref.get(jobsRef);
        const job = jobs.get(jobId);
        if (!job) {
          return undefined;
        }

        // best-effort cancel doesn't stop the worker — a job already terminal (notably "cancelled")
        // must not be resurrected by a late completion/failure landing after the cancel.
        if (isTerminalJobStatus(job.status)) {
          return job;
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

        yield* Ref.update(jobsRef, (current) => {
          const next = new Map(current);
          next.set(jobId, nextJob);
          return next;
        });

        return nextJob;
      }),
    failJob: (jobId, error, completedAt = new Date().toISOString()) =>
      Effect.gen(function* () {
        const jobs = yield* Ref.get(jobsRef);
        const job = jobs.get(jobId);
        if (!job) {
          return undefined;
        }

        // same guard as completeJob() — a late failure must not overwrite an already-cancelled job.
        if (isTerminalJobStatus(job.status)) {
          return job;
        }

        const nextJob: StoredJob = {
          ...job,
          status: "failed",
          error,
          completedAt,
          updatedAt: completedAt
        };

        yield* Ref.update(jobsRef, (current) => {
          const next = new Map(current);
          next.set(jobId, nextJob);
          return next;
        });

        return nextJob;
      }),
    cancelJob: (jobId, completedAt = new Date().toISOString()) =>
      Effect.gen(function* () {
        const jobs = yield* Ref.get(jobsRef);
        const job = jobs.get(jobId);
        if (!job) {
          return undefined;
        }

        if (job.status !== "queued" && job.status !== "running") {
          return job;
        }

        const nextJob: StoredJob = {
          ...job,
          status: "cancelled",
          completedAt,
          updatedAt: completedAt
        };

        yield* Ref.update(jobsRef, (current) => {
          const next = new Map(current);
          next.set(jobId, nextJob);
          return next;
        });

        return nextJob;
      })
  };
}
