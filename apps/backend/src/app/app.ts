import { Effect } from "effect";
import { Hono } from "hono";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { BackendConfig } from "../config/config.js";
import { createBackendExecutionService } from "../execution.js";
import { createBackendProviderTransport } from "../execution/pipeline/provider-transport.js";
import { createBackendMemoryBundleService } from "../memory/memory.js";
import { createBackendJobWorker } from "../jobs/worker.js";
import type { BackendProductServices } from "../product.js";
import { registerBackendRoutes } from "./routes.js";
import { createBackendHardening } from "../production/index.js";
import { resolveTrustedClientIp } from "../production/trusted-client-ip.js";
import type { BackendJobStoreServiceContract } from "../jobs/job-store.js";
import { createBackendRuntimeBundle, type BackendRuntimeBundle } from "../runtime/create-runtime-bundle.js";
import { createRedisRateLimitStore } from "../runtime/redis-rate-limit-store.js";
import { getSharedRedisClient } from "../infra/redis-client.js";

export interface BackendAppOptions {
  readonly startedAt?: Date;
  readonly now?: () => Date;
  readonly logger?: AppLogger;
  readonly services: BackendProductServices;
  readonly runtime?: BackendRuntimeBundle;
  readonly hardeningChecks?: Partial<{
    readonly auth: () => Effect.Effect<void, string>;
    readonly database: () => Effect.Effect<void, string>;
  }>;
}

export function createBackendApp(config: BackendConfig, options: BackendAppOptions) {
  const app = new Hono();
  const startedAt = options.startedAt ?? new Date();
  const now = options.now ?? (() => new Date());
  const services = options.services;
  const logger = options.logger;
  const providerTransport = createBackendProviderTransport(config);
  const memory = Effect.runSync(
    createBackendMemoryBundleService({
      database: services.database,
      namespace: config.serviceName
    })
  );
  const runtime = options.runtime ?? Effect.runSync(
    createBackendRuntimeBundle({
      config,
      services,
      now,
      logger
    })
  );
  if (!options.runtime) {
    runtime.start();
  }

  const jobs = runtime.jobs;
  let onQueuedJob: ((job: import("../jobs/worker.js").BackendQueuedJob) => void) | undefined;

  if (runtime.mode === "memory") {
    const worker = createBackendJobWorker({
      config,
      jobStore: jobs,
      logger,
      now,
      memory,
      services: {
        ...services,
        billing: runtime.billing
      },
      providerTransport
    });
    onQueuedJob = worker.enqueue;
  }

  const execution = createBackendExecutionService({
    config,
    jobStore: jobs,
    logger,
    now,
    onQueuedJob,
    durableEnqueue: jobs.enqueueAtomic,
    runtimeMode: runtime.mode,
    services: {
      ...services,
      billing: runtime.billing
    },
    providerTransport,
    memory: memory.memory,
    corpus: memory.corpus
  });

  const durableRateLimitStore =
    runtime.mode === "durable" && config.redisUrl
      ? createRedisRateLimitStore(getSharedRedisClient(config))
      : undefined;

  const hardening = createBackendHardening({
    config,
    now,
    logger,
    services,
    durableRateLimitStore,
    dependencyChecks: options.hardeningChecks
  });

  app.use(async (c, next) => {
    const origin = c.req.header("origin");
    const corsHeaders = hardening.getCorsHeaders(origin);

    if (c.req.method === "OPTIONS") {
      const response = new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          ...hardening.getSecurityHeaders()
        }
      });
      return response;
    }

    await import("../http/http.js").then(({ runEffectOrThrow }) =>
      runEffectOrThrow(
        hardening.assertTrafficAllowed({
          method: c.req.method,
          path: c.req.path,
          origin,
          clientKey: resolveTrustedClientIp(c, {
            trustProxy: config.trustProxy ?? config.environment === "production"
          })
        })
      )
    );

    await next();

    for (const [header, value] of Object.entries(hardening.getSecurityHeaders())) {
      c.res.headers.set(header, value);
    }

    for (const [header, value] of Object.entries(corsHeaders)) {
      c.res.headers.set(header, value);
    }
  });

  app.onError(async (error, c) => {
    const { mapErrorToHttp } = await import("../http/error-response.js");
    const { createErrorBody, toErrorMessage } = await import("../http/http.js");
    const { status, body } = mapErrorToHttp(error, c.req.path);
    try {
      const response = await createErrorBody(body);
      return c.json(response, status);
    } catch (validationError) {
      const fallback = await createErrorBody({
        status: 500,
        code: "internal_error",
        category: "internal",
        message: toErrorMessage(validationError),
        retryable: true
      });
      return c.json(fallback, 500);
    }
  });

  registerBackendRoutes(app, {
    config,
    startedAt,
    now,
    logger,
    services: {
      ...services,
      billing: runtime.billing
    },
    jobs: jobs as BackendJobStoreServiceContract,
    execution,
    hardening
  });

  return app;
}
