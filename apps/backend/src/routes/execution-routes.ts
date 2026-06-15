import { Hono } from "hono";
import {
  type ExecutionStatusView,
  ExecutionStatusViewSchema,
  type ExecutionsPageView,
  ExecutionsPageViewSchema,
  decodeMeExecutionRequest,
  type QueuedExecutionView,
  QueuedExecutionViewSchema,
  type SyncExecutionView,
  SyncExecutionViewSchema
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  BackendAuthorizationError,
  BackendExecutionFailedError,
  BackendExecutionNotFoundError,
  BackendRequestBodyParseError
} from "../http/errors.js";
import { createJobEventStream } from "../jobs/job-events.js";
import type { BackendProductServices } from "../product.js";
import { createBackendPublicGenerationService } from "../product/generation/public-generation.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface ExecutionRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly execution: import("../execution.js").BackendExecutionService;
  readonly jobs: import("./job-store.js").BackendJobStoreServiceContract;
}

export function registerExecutionRoutes(app: Hono, options: ExecutionRouteOptions): void {
  const publicGeneration = createBackendPublicGenerationService({
    config: options.config,
    services: options.services,
    execution: options.execution
  });

  app.post("/me/executions/run", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostMeExecutionsRun, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeExecutionsRun);
    const input = await runEffectOrThrow(decodeMeExecutionRequest(rawBody));
    const response = await runEffectOrThrow(publicGeneration.execute({ userId: actor.userId, ...input }));

    if ("jobId" in response) {
      const queued = await runEffectOrThrow(options.jobs.getJobStatus(response.jobId));
      if (!queued) {
        throw new BackendExecutionNotFoundError({ executionId: response.jobId, userId: actor.userId });
      }
      if (!queued.voice) {
        throw new BackendExecutionFailedError({
          message: `Queued execution "${response.jobId}" is missing voice metadata`,
          reason: "Voice profile unavailable"
        });
      }

      const voice = queued.voice;
      const queuedExecution = {
        ...response,
        status: "queued" as const,
        voice
      };
      const validated = await validateResponseBody(
        QueuedExecutionViewSchema,
        queuedExecution satisfies QueuedExecutionView,
        "QueuedExecutionView"
      );
      return c.json(validated, 202);
    }

    if (!response.voice) {
      throw new BackendExecutionFailedError({
        message: `Execution result for "${response.pipelineName}" is missing voice metadata`,
        reason: "Voice profile unavailable"
      });
    }

    const voice = response.voice;
    const syncExecution = {
      ...response,
      voice
    } as SyncExecutionView;
    const validated = await validateResponseBody(SyncExecutionViewSchema, syncExecution, "SyncExecutionView");
    return c.json(validated);
  });

  app.get("/me/executions", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeExecutions, options.services);
    const { limit, offset } = parsePageQuery(c);
    const jobs = await runEffectOrThrow(options.jobs.listJobs());
    const userJobs = jobs.filter((job) => job.userId === actor.userId);
    const page = paginateExecutions(userJobs, limit, offset);
    const validated = await validateResponseBody(ExecutionsPageViewSchema, page satisfies ExecutionsPageView, "ExecutionsPageView");
    return c.json(validated);
  });

  app.get("/me/executions/:executionId", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeExecution, options.services);
    const executionId = requireRouteParam(c, "executionId");
    const job = await runEffectOrThrow(options.jobs.getJobStatus(executionId));
    if (!job) {
      throw new BackendExecutionNotFoundError({ executionId, userId: actor.userId });
    }

    if (job.userId && job.userId !== actor.userId) {
      throw new BackendAuthorizationError({
        userId: actor.userId,
        reason: "not_owner",
        message: `Authenticated actor does not own execution ${executionId}`
      });
    }

    const validated = await validateResponseBody(
      ExecutionStatusViewSchema,
      job satisfies ExecutionStatusView,
      "ExecutionStatusView"
    );
    return c.json(validated);
  });

  app.get("/me/executions/:executionId/events", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeExecutionEvents, options.services);
    const executionId = requireRouteParam(c, "executionId");
    const job = await runEffectOrThrow(options.jobs.getJobStatus(executionId));
    if (!job) {
      throw new BackendExecutionNotFoundError({ executionId, userId: actor.userId });
    }

    if (job.userId && job.userId !== actor.userId) {
      throw new BackendAuthorizationError({
        userId: actor.userId,
        reason: "not_owner",
        message: `Authenticated actor does not own execution ${executionId}`
      });
    }

    return await createJobEventStream(options.jobs, executionId);
  });
}

function paginateExecutions(
  jobs: readonly ExecutionStatusView[],
  limit: number,
  offset: number
): ExecutionsPageView {
  return {
    items: jobs.slice(offset, offset + limit),
    total: jobs.length,
    limit,
    offset
  };
}

function parsePageQuery(c: import("hono").Context): { readonly limit: number; readonly offset: number } {
  const route = "GET /me/executions";
  const query = c.req.query();
  return {
    limit: parseNonNegativeInteger(query.limit, 20, "limit", route),
    offset: parseNonNegativeInteger(query.offset, 0, "offset", route)
  };
}

function parseNonNegativeInteger(value: string | undefined, fallback: number, field: string, route: string): number {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BackendRequestBodyParseError({
      route,
      message: `Query parameter ${field} must be a non-negative integer`
    });
  }

  return parsed;
}

function requireRouteParam(c: import("hono").Context, name: string): string {
  const value = c.req.param(name);
  if (!value || value.trim().length === 0) {
    throw new BackendRequestBodyParseError({
      route: c.req.path,
      message: `Route parameter ${name} is required`
    });
  }

  return value;
}
