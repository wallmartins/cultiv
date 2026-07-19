import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { JobError, JobProgress, JobResult, PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import { Effect } from "effect";
import { persistBackendAuditEvent } from "../core/audit-trail.js";
import { swallowWithDiagnostic } from "../../effects/non-blocking-diagnostics.js";
import { persistContentType } from "../catalog/persistence-content-types.js";

export function persistQueuedJob(
  database: DatabaseClient,
  args: {
    readonly jobId: string;
    readonly request: PipelineRequest;
    readonly plan: OrchestrationPlan;
    readonly createdAt: string;
  }
): Effect.Effect<void, never> {
  const actor = resolveQueuedJobActor(requestActorSource(args.request));
  const jobUserId =
    "userId" in args.request && typeof args.request.userId === "string" ? args.request.userId : "anonymous";
  return database.transaction((trxDatabase) =>
    Effect.gen(function* () {
      yield* trxDatabase.jobs.create(
        {
          id: args.jobId,
          userId: jobUserId,
          status: "queued",
          executionMode: args.plan.request.executionMode,
          contentType: args.plan.contentType.id,
          createdAt: args.createdAt,
          completedAt: null,
          pipelineId: args.plan.pipeline.name
        },
        {
          progress: {
            currentStep: "queued",
            stepIndex: 0,
            totalSteps: Math.max(1, args.plan.pipeline.steps.length),
            percent: 0
          },
          updatedAt: args.createdAt,
          history: [
            {
              type: "created",
              at: args.createdAt,
              payload: {
                contentType: args.plan.contentType.id,
                executionMode: args.plan.request.executionMode,
                pipelineName: args.plan.pipeline.name,
                requestVariant: "pipeline" in args.request ? "explicit" : "simplified"
              }
            }
          ]
        }
      );
      yield* persistContentType(trxDatabase, args.plan, args.createdAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:queued:${args.createdAt}`,
        actorId: actor.actorId,
        actorType: actor.actorType,
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.queued",
        occurredAt: args.createdAt,
        metadata: {
          contentType: args.plan.contentType.id,
          executionMode: args.plan.request.executionMode,
          pipelineName: args.plan.pipeline.name
        }
      });
    })
  ).pipe(
    Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist queued job",
      context: { jobId: args.jobId, pipelineName: args.plan.pipeline.name }
    })),
    Effect.map(() => undefined)
  );
}

export function persistJobProgress(
  database: DatabaseClient,
  args: {
    readonly jobId: string;
    readonly progress: JobProgress;
    readonly updatedAt: string;
  }
): Effect.Effect<void, never> {
  return database.transaction((trxDatabase) =>
    Effect.gen(function* () {
      yield* trxDatabase.jobs.recordProgress(args.jobId, args.progress, args.updatedAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:progress:${args.updatedAt}:${args.progress.currentStep}:${args.progress.percent}`,
        actorId: "system",
        actorType: "system",
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.progress_recorded",
        occurredAt: args.updatedAt,
        metadata: {
          currentStep: args.progress.currentStep,
          stepIndex: args.progress.stepIndex,
          totalSteps: args.progress.totalSteps,
          percent: args.progress.percent
        }
      });
    })
  ).pipe(
    Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist job progress",
      context: { jobId: args.jobId, currentStep: args.progress.currentStep }
    })),
    Effect.map(() => undefined)
  );
}

function requestActorSource(request: PipelineRequest): string | undefined {
  return "userId" in request && typeof request.userId === "string"
    ? request.userId
    : undefined;
}

function resolveQueuedJobActor(actorId: string | undefined): {
  readonly actorId: string;
  readonly actorType: "application_user" | "system";
} {
  return actorId
    ? { actorId, actorType: "application_user" }
    : { actorId: "system", actorType: "system" };
}

export function persistJobCompletion(
  database: DatabaseClient,
  args: {
    readonly jobId: string;
    readonly result: JobResult;
    readonly completedAt: string;
  }
): Effect.Effect<void, never> {
  return database.transaction((trxDatabase) =>
    Effect.gen(function* () {
      yield* trxDatabase.jobs.complete(args.jobId, args.result, args.completedAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:completed:${args.completedAt}`,
        actorId: "system",
        actorType: "system",
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.completed",
        occurredAt: args.completedAt,
        metadata: {
          outputKeys: Object.keys(args.result)
        }
      });
    })
  ).pipe(
    Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist job completion",
      context: { jobId: args.jobId }
    })),
    Effect.map(() => undefined)
  );
}

export function persistJobFailure(
  database: DatabaseClient,
  args: {
    readonly jobId: string;
    readonly error: JobError;
    readonly completedAt: string;
  }
): Effect.Effect<void, never> {
  return database.transaction((trxDatabase) =>
    Effect.gen(function* () {
      yield* trxDatabase.jobs.fail(args.jobId, args.error, args.completedAt);
      yield* persistBackendAuditEvent(trxDatabase, {
        logicalKey: `job:${args.jobId}:failed:${args.completedAt}`,
        actorId: "system",
        actorType: "system",
        resourceType: "job",
        resourceId: args.jobId,
        mutationType: "job.failed",
        occurredAt: args.completedAt,
        metadata: {
          message: args.error.message,
          step: args.error.step ?? null
        }
      });
    })
  ).pipe(
    Effect.catchAll(swallowWithDiagnostic({
      operation: "Failed to persist job failure",
      context: { jobId: args.jobId, step: args.error.step ?? null }
    })),
    Effect.map(() => undefined)
  );
}
