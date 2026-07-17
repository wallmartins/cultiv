import { Hono } from "hono";
import {
  type HealthCheckResponse,
  type ReadinessResponse,
  HealthCheckResponseSchema,
  ReadinessResponseSchema
} from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { createErrorBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import type { BackendJobStoreServiceContract } from "../jobs/job-store.js";
import { registerExecutionRoutes } from "../routes/execution-routes.js";
import { registerGenerationIntentRoutes } from "../routes/generation-intent-routes.js";
import { registerOnboardingRoutes } from "../routes/onboarding-routes.js";
import { registerGenerationPreviewRoutes } from "../routes/generation-preview-routes.js";
import { registerGenerationPrefillRoutes } from "../routes/generation-prefill-routes.js";
import { registerExperimentalExecutionRoutes } from "../routes/experimental-execution-routes.js";
import { registerInternalPolicyRoutes } from "../routes/internal-policy-routes.js";
import { registerInternalOverrideRoutes } from "../routes/internal-override-routes.js";
import { registerVoiceRoutes } from "../routes/voice-routes.js";
import { registerVoiceCalibrationRoutes } from "../routes/voice-calibration-routes.js";
import { registerDevShowcaseRoutes } from "../routes/dev-showcase-routes.js";
import { registerBillingRoutes } from "../routes/billing-routes.js";
import { registerBillingWebhookRoutes } from "../routes/billing-webhook-routes.js";
import { registerAccountRoutes } from "../routes/account-routes.js";
export interface BackendRouteOptions {
  readonly config: BackendConfig;
  readonly startedAt: Date;
  readonly now: () => Date;
  readonly logger?: import("@my-ai-orchestrator/core").AppLogger;
  readonly services: BackendProductServices;
  readonly jobs: BackendJobStoreServiceContract;
  readonly execution: import("../execution.js").BackendExecutionService;
  readonly hardening: import("./production-hardening.js").BackendHardeningContract;
}

export function registerBackendRoutes(app: Hono, options: BackendRouteOptions): void {
  const api = new Hono();
  const health = new Hono();
  const ready = new Hono();

  health.get("/", async (c) => {
    const response = await validateResponseBody(HealthCheckResponseSchema, {
      status: "ok",
      time: options.now().toISOString(),
      engine: {
        status: "ready",
        version: options.config.version,
        uptimeSec: Math.max(0, Math.floor((options.now().getTime() - options.startedAt.getTime()) / 1000))
      }
    } satisfies HealthCheckResponse, "HealthCheckResponse");

    return c.json(response);
  });

  ready.get("/", async (c) => {
    const readiness = await runEffectOrThrow(options.hardening.evaluateReadiness());
    const response = await validateResponseBody(
      ReadinessResponseSchema,
      readiness satisfies ReadinessResponse,
      "ReadinessResponse"
    );

    return c.json(response, response.status === "ready" ? 200 : 503);
  });

  api.post("/run", async (c) => {
    const response = await createErrorBody({
      status: 410,
      code: "invalid_request",
      category: "not_found",
      message: "POST /api/run was removed. Use POST /me/executions/run instead.",
      retryable: false,
      details: {
        migration: "POST /me/executions/run"
      }
    });

    return c.json(response, 410);
  });
  registerVoiceRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerVoiceCalibrationRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerOnboardingRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerGenerationIntentRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerGenerationPreviewRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerGenerationPrefillRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerInternalPolicyRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerInternalOverrideRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerExecutionRoutes(app, {
    config: options.config,
    services: options.services,
    execution: options.execution,
    jobs: options.jobs
  });
  registerExperimentalExecutionRoutes(app, {
    config: options.config,
    services: options.services,
    execution: options.execution
  });
  registerDevShowcaseRoutes(app, {
    config: options.config,
    services: options.services,
    now: options.now
  });
  registerBillingRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerBillingWebhookRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerAccountRoutes(app, {
    config: options.config,
    services: options.services,
    jobs: options.jobs
  });

  app.route("/health", health);
  app.route("/api/health", health);
  app.route("/ready", ready);
  app.route("/api/ready", ready);
  app.route("/api", api);

  app.notFound(async (c) => {
    const response = await createErrorBody({
      status: 404,
      code: "resource_not_found",
      category: "not_found",
      message: `Route ${c.req.path} was not found`,
      retryable: false,
      details: {
        method: c.req.method,
        path: c.req.path
      }
    });

    return c.json(response, 404);
  });
}
