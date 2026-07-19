import { Hono, type Context } from "hono";
import { Effect, Schema } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import {
  type AccountDeleteRequest,
  type AccountDeleteResponse,
  type AccountExportJobView,
  type AccountResetResponse,
  AccountDeleteResponseSchema,
  AccountExportJobViewSchema,
  AccountResetResponseSchema,
  decodeAccountDeleteRequest
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import type { BackendJobStoreServiceContract } from "../jobs/job-store.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { runEffectOrThrow, validateResponseBody } from "../http/http.js";
import {
  BackendAccountExportNotFoundError,
  BackendAccountNotConfiguredError,
  BackendRequestBodyParseError
} from "../http/errors.js";
import { Routes } from "../app/route-definitions.js";
import { getSharedRedisClient, flushUserRedisKeys } from "../infra/redis-client.js";
import { cancelInFlightExecutionsForUser } from "../product/account/account-execution-purge.js";
import { consumeAccountExportDownload } from "../product/account/account-export-service.js";

export interface AccountRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly jobs: BackendJobStoreServiceContract;
}

function requireRouteParam(c: Context, name: string): string {
  const value = c.req.param(name);
  if (!value || value.trim().length === 0) {
    throw new BackendRequestBodyParseError({
      route: c.req.path,
      message: `Route parameter ${name} is required`
    });
  }

  return value;
}

// contract-08 decision 8 — reset's pre-purge: cancel in-flight generations (N3) then best-effort
// flush any per-user Redis keys, before reset's storage transaction runs. (Delete's pre-purge is
// NOT this function — it's sequenced inside accountOps.delete, AFTER the gateway cancel succeeds;
// see the ordering note there.)
async function runPrePurge(options: AccountRouteOptions, userId: string, reason: string): Promise<void> {
  await runEffectOrThrow(cancelInFlightExecutionsForUser(options.jobs, userId, reason));

  if (options.config.redisUrl) {
    await flushUserRedisKeys(getSharedRedisClient(options.config), userId).catch(() => undefined);
  }
}

// same pre-purge work as runPrePurge, but as an Effect thunk accountOps.delete invokes itself, only
// once the gateway cancel has already succeeded. A cancel-in-flight failure here aborts the delete
// (propagated, not swallowed) — proceeding to hard-delete jobs without being able to stop a worker
// from writing to one mid-purge is the exact race this step exists to prevent. Redis flush stays
// best-effort (pure hygiene, not a correctness precondition).
function buildDeletePrePurge(
  options: AccountRouteOptions,
  userId: string
): () => Effect.Effect<void, DatabaseError> {
  return () =>
    Effect.gen(function* () {
      yield* cancelInFlightExecutionsForUser(options.jobs, userId, "account_delete");

      if (options.config.redisUrl) {
        yield* Effect.promise(() =>
          flushUserRedisKeys(getSharedRedisClient(options.config), userId).catch(() => undefined)
        );
      }
    });
}

export function registerAccountRoutes(app: Hono, options: AccountRouteOptions): void {
  app.post(
    "/me/account/export",
    createPublicRouteHandler<AccountExportJobView>({
      route: Routes.PostMeAccountExport,
      config: options.config,
      services: options.services,
      responseSchema: AccountExportJobViewSchema as Schema.Schema<AccountExportJobView, unknown, any>,
      responseSchemaName: "AccountExportJobView",
      handler: async ({ actor }) => {
        if (!options.services.accountExport) {
          throw new BackendAccountNotConfiguredError({ route: Routes.PostMeAccountExport });
        }

        return runEffectOrThrow(options.services.accountExport.requestExport(actor.userId));
      }
    })
  );

  app.get(
    "/me/account/export/:jobId",
    createPublicRouteHandler<AccountExportJobView>({
      route: Routes.GetMeAccountExportJob,
      config: options.config,
      services: options.services,
      responseSchema: AccountExportJobViewSchema as Schema.Schema<AccountExportJobView, unknown, any>,
      responseSchemaName: "AccountExportJobView",
      handler: async ({ c, actor }) => {
        if (!options.services.accountExport) {
          throw new BackendAccountNotConfiguredError({ route: Routes.GetMeAccountExportJob });
        }

        const jobId = requireRouteParam(c, "jobId");
        return runEffectOrThrow(options.services.accountExport.getExportStatus(actor.userId, jobId));
      }
    })
  );

  // not schema-validated (raw attachment, not an AccountExportJobView) — plain Hono handler.
  app.get("/me/account/export/:jobId/download", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeAccountExportDownload, options.services);
    if (!options.config.redisUrl) {
      throw new BackendAccountNotConfiguredError({ route: Routes.GetMeAccountExportDownload });
    }

    const jobId = requireRouteParam(c, "jobId");
    const download = await runEffectOrThrow(
      consumeAccountExportDownload(getSharedRedisClient(options.config), actor.userId, jobId)
    );
    if (!download) {
      throw new BackendAccountExportNotFoundError({ jobId });
    }

    c.header("Content-Disposition", `attachment; filename="cultiv-export-${jobId}.json"`);
    return c.json(download.bundle);
  });

  app.post(
    "/me/account/reset",
    createPublicRouteHandler<AccountResetResponse>({
      route: Routes.PostMeAccountReset,
      config: options.config,
      services: options.services,
      responseSchema: AccountResetResponseSchema as Schema.Schema<AccountResetResponse, unknown, any>,
      responseSchemaName: "AccountResetResponse",
      handler: async ({ actor }) => {
        if (!options.services.accountOps) {
          throw new BackendAccountNotConfiguredError({ route: Routes.PostMeAccountReset });
        }

        await runPrePurge(options, actor.userId, "account_reset");
        return runEffectOrThrow(options.services.accountOps.reset(actor.userId));
      }
    })
  );

  app.delete(
    "/me/account",
    createPublicRouteHandler<AccountDeleteRequest, AccountDeleteResponse>({
      route: Routes.DeleteMeAccount,
      config: options.config,
      services: options.services,
      decodeInput: decodeAccountDeleteRequest,
      responseSchema: AccountDeleteResponseSchema as Schema.Schema<AccountDeleteResponse, unknown, any>,
      responseSchemaName: "AccountDeleteResponse",
      handler: async ({ actor, input }) => {
        if (!options.services.accountOps) {
          throw new BackendAccountNotConfiguredError({ route: Routes.DeleteMeAccount });
        }

        // accountOps.delete owns the whole sequence — confirmation, idempotency, gateway cancel,
        // pre-purge, transaction — in that order. The route only supplies the pre-purge closure
        // (it owns the job store/Redis client); the service decides WHEN to call it.
        return runEffectOrThrow(
          options.services.accountOps.delete(actor.userId, input, buildDeletePrePurge(options, actor.userId))
        );
      }
    })
  );
}
