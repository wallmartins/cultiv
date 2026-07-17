import { Hono } from "hono";
import { Schema } from "effect";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  type ExecutionReactionView,
  ExecutionReactionViewSchema,
  type ExecutionStatusView,
  ExecutionStatusViewSchema,
  type ExecutionVoiceMetadataView,
  type ExecutionsPageView,
  ExecutionsPageViewSchema,
  decodeCancelExecutionRequest,
  decodeExecutionsListQuery,
  decodeMeExecutionRequest,
  decodeSubmitReactionRequest,
  normalizeExecutionsListFilters,
  type QueuedExecutionView,
  QueuedExecutionViewSchema,
  type SyncExecutionView,
  SyncExecutionViewSchema
} from "@my-ai-orchestrator/contracts";
import type { ExecutionReactionRecord } from "@my-ai-orchestrator/database";
import {
  BackendAuthorizationError,
  BackendExecutionFailedError,
  BackendExecutionNotFoundError,
  BackendRequestBodyParseError
} from "../http/errors.js";
import { createJobEventStream } from "../jobs/job-events.js";
import type { BackendJobStoreServiceContract } from "../jobs/job-store.js";
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
    const job = await requireOwnedJob(options.jobs, executionId, actor.userId);
    const reaction = await runEffectOrThrow(
      options.services.database.executionReactions.getByExecution(executionId)
    );

    const validated = await validateResponseBody(
      ExecutionStatusViewSchema,
      { ...job, reaction: reaction ? toReactionView(reaction) : null } satisfies ExecutionStatusView,
      "ExecutionStatusView"
    );
    return c.json(validated);
  });

  app.get("/me/executions/:executionId/events", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeExecutionEvents, options.services);
    const executionId = requireRouteParam(c, "executionId");
    await requireOwnedJob(options.jobs, executionId, actor.userId);

    return await createJobEventStream(options.jobs, executionId);
  });

  app.post("/me/executions/:executionId/reaction", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostMeExecutionReaction, options.services);
    const executionId = requireRouteParam(c, "executionId");
    await requireOwnedJob(options.jobs, executionId, actor.userId);

    const rawBody = await readJsonBody(c, Routes.PostMeExecutionReaction);
    const input = await runEffectOrThrow(decodeSubmitReactionRequest(rawBody));
    const now = new Date().toISOString();
    const existing = await runEffectOrThrow(
      options.services.database.executionReactions.getByExecution(executionId)
    );

    const record: ExecutionReactionRecord = {
      executionId,
      userId: actor.userId,
      reaction: input.reaction,
      ...(input.reason ? { reason: input.reason } : {}),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    await runEffectOrThrow(options.services.database.executionReactions.upsert(record));

    const validated = await validateResponseBody(
      ExecutionReactionViewSchema,
      toReactionView(record),
      "ExecutionReactionView"
    );
    return c.json(validated);
  });

  app.delete("/me/executions/:executionId/reaction", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.DeleteMeExecutionReaction, options.services);
    const executionId = requireRouteParam(c, "executionId");
    await requireOwnedJob(options.jobs, executionId, actor.userId);

    await runEffectOrThrow(options.services.database.executionReactions.deleteByExecution(executionId));
    return c.body(null, 204);
  });

  app.post("/me/executions/:executionId/cancel", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostMeExecutionCancel, options.services);
    const executionId = requireRouteParam(c, "executionId");
    const job = await requireOwnedJob(options.jobs, executionId, actor.userId);

    if (job.status !== "queued" && job.status !== "running") {
      const validated = await validateResponseBody(ExecutionStatusViewSchema, job, "ExecutionStatusView");
      return c.json(validated, 200);
    }

    const rawBody = await readOptionalJsonBody(c);
    const input = await runEffectOrThrow(decodeCancelExecutionRequest(rawBody));
    const cancelled = await runEffectOrThrow(options.jobs.cancelJob(executionId, input.reason));

    const validated = await validateResponseBody(
      ExecutionStatusViewSchema,
      (cancelled ?? job) satisfies ExecutionStatusView,
      "ExecutionStatusView"
    );
    return c.json(validated, 200);
  });
}

async function requireOwnedJob(
  jobs: BackendJobStoreServiceContract,
  executionId: string,
  actorUserId: string
): Promise<ExecutionStatusView> {
  const job = await runEffectOrThrow(jobs.getJobStatus(executionId));
  if (!job) {
    throw new BackendExecutionNotFoundError({ executionId, userId: actorUserId });
  }

  if (job.userId && job.userId !== actorUserId) {
    throw new BackendAuthorizationError({
      userId: actorUserId,
      reason: "not_owner",
      message: `Authenticated actor does not own execution ${executionId}`
    });
  }

  return job;
}

function toReactionView(record: ExecutionReactionRecord): ExecutionReactionView {
  return {
    value: record.reaction,
    ...(record.reason ? { reason: record.reason } : {}),
    reactedAt: record.updatedAt
  };
}

// cancel's body is optional (`{ reason? }`) — an empty/absent body is not a parse error here.
async function readOptionalJsonBody(c: import("hono").Context): Promise<unknown> {
  const text = await c.req.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new BackendRequestBodyParseError({
      route: Routes.PostMeExecutionCancel,
      message: "Request body must be valid JSON"
    });
  }
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
      ...(query.lengthTier ? { lengthTier: query.lengthTier } : {}),
      ...(query.q ? { q: query.q } : {})
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
