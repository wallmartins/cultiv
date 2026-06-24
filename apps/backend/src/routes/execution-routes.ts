import { Hono } from "hono";
import { Schema } from "effect";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  type ExecutionStatusView,
  ExecutionStatusViewSchema,
  type ExecutionVoiceMetadataView,
  type ExecutionsPageView,
  ExecutionsPageViewSchema,
  decodeExecutionsListQuery,
  decodeMeExecutionRequest,
  normalizeExecutionsListFilters,
  type QueuedExecutionView,
  QueuedExecutionViewSchema,
  type SyncExecutionView,
  SyncExecutionViewSchema
} from "@my-ai-orchestrator/contracts";
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
import { createPublicRouteHandler } from "../http/public-route.js";
import { Routes } from "../app/route-definitions.js";

export interface ExecutionRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly execution: import("../execution.js").BackendExecutionService;
  readonly jobs: import("../jobs/job-store.js").BackendJobStoreServiceContract;
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
      const voice = (response as { readonly voice?: ExecutionVoiceMetadataView }).voice;
      if (!voice) {
        throw new BackendExecutionFailedError({
          message: `Queued execution "${response.jobId}" is missing voice metadata`,
          reason: "Voice profile unavailable"
        });
      }

      const queuedExecution: QueuedExecutionView = {
        ...response,
        status: "queued",
        voice
      };
      const validated = await validateResponseBody(
        QueuedExecutionViewSchema,
        queuedExecution,
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

  app.get(
    "/me/executions",
    createPublicRouteHandler<ExecutionsPageView>({
      route: Routes.GetMeExecutions,
      config: options.config,
      services: options.services,
      responseSchema: ExecutionsPageViewSchema as Schema.Schema<ExecutionsPageView, unknown, any>,
      responseSchemaName: "ExecutionsPageView",
      handler: async ({ actor, c }) => {
        const { limit, offset, filters } = await parseExecutionsListQuery(c);
        const pageResult = await runEffectOrThrow(
          options.jobs.listJobsForUser(actor.userId, limit, offset, filters)
        );
        return {
          items: pageResult.items,
          total: pageResult.total,
          limit,
          offset
        } satisfies ExecutionsPageView;
      }
    })
  );

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


function parseExecutionsListQuery(
  c: import("hono").Context
): Promise<{ readonly limit: number; readonly offset: number; readonly filters: ReturnType<typeof normalizeExecutionsListFilters> }> {
  const route = Routes.GetMeExecutions;
  const query = c.req.query();
  const limit = parseNonNegativeInteger(query.limit, 20, "limit", route);
  const offset = parseNonNegativeInteger(query.offset, 0, "offset", route);

  return runEffectOrThrow(
    decodeExecutionsListQuery({
      ...(query.period ? { period: query.period } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.contentType ? { contentType: query.contentType } : {}),
      ...(query.intent ? { intent: query.intent } : {}),
      ...(query.lengthTier ? { lengthTier: query.lengthTier } : {})
    })
  ).then((decoded) => ({
    limit,
    offset,
    filters: normalizeExecutionsListFilters(decoded)
  }));
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
