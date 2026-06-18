import { Hono, type Context } from "hono";
import { Effect } from "effect";
import {
  type HealthCheckResponse,
  type JobCreatedResponse,
  type PipelineRequest,
  type ReadinessResponse,
  type RunResponse,
  HealthCheckResponseSchema,
  JobCreatedResponseSchema,
  ReadinessResponseSchema,
  RunResponseSchema,
  decodePipelineRequest
} from "@my-ai-orchestrator/contracts";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { createErrorBody, readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import type { BackendJobStoreServiceContract } from "../jobs/job-store.js";
import { assertQuoteConsistency, resolveExecutionPricingSnapshot } from "../product/billing/generation-pricing-snapshot.js";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import { registerExecutionRoutes } from "../routes/execution-routes.js";
import { registerContentTypeRoutes } from "../routes/content-type-routes.js";
import { registerGenerationPreviewRoutes } from "../routes/generation-preview-routes.js";
import { registerExperimentalExecutionRoutes } from "../routes/experimental-execution-routes.js";
import { registerInternalPolicyRoutes } from "../routes/internal-policy-routes.js";
import { registerInternalOverrideRoutes } from "../routes/internal-override-routes.js";
import { registerVoiceRoutes } from "../routes/voice-routes.js";
import { registerDevShowcaseRoutes } from "../routes/dev-showcase-routes.js";
import { registerBillingRoutes } from "../routes/billing-routes.js";
import { registerBillingWebhookRoutes } from "../routes/billing-webhook-routes.js";
import { Routes } from "./route-definitions.js";

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

type AuthenticatedPipelineRequest = PipelineRequest & {
  readonly userId: string;
};

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

  const runHandler = async (c: Context) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostApiRun, options.services);
    const rawBody = await readJsonBody(c, Routes.PostApiRun);
    const request = await runEffectOrThrow(decodePipelineRequest(shapePublicPipelineRequest(rawBody, actor.userId)));
    const authenticatedRequest = toAuthenticatedPipelineRequest(request, actor.userId);
    const sanitizedInput = await runEffectOrThrow(options.services.inputSafety.authorizeGenerationInput(authenticatedRequest));
    const approvedRequest = { ...authenticatedRequest, ...sanitizedInput } satisfies AuthenticatedPipelineRequest;
    if ("quoteId" in approvedRequest && approvedRequest.quoteId) {
      const pricingSnapshot = await runEffectOrThrow(
        resolveExecutionPricingSnapshot({
          userId: approvedRequest.userId,
          request: approvedRequest,
          config: options.config,
          billing: options.services.billing,
          aiPolicy: options.services.aiPolicy
        })
      );
      await runEffectOrThrow(
        assertQuoteConsistency({
          providedQuoteId: approvedRequest.quoteId,
          pricingSnapshot
        })
      );
    }
    await runEffectOrThrow(options.services.aiPolicy.validatePipelineRequest(approvedRequest));
    const response = await runEffectOrThrow(options.execution.execute(approvedRequest));

    if ("jobId" in response) {
      const validatedJob = await validateResponseBody(
        JobCreatedResponseSchema,
        response satisfies JobCreatedResponse,
        "JobCreatedResponse"
      );
      return c.json(validatedJob, 202);
    }

    const validatedRun = await validateResponseBody(RunResponseSchema, response satisfies RunResponse, "RunResponse");
    return c.json(validatedRun);
  };

  api.post("/run", runHandler);
  registerVoiceRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerContentTypeRoutes(app, {
    config: options.config,
    services: options.services
  });
  registerGenerationPreviewRoutes(app, {
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

function toAuthenticatedPipelineRequest(request: PipelineRequest, userId: string): AuthenticatedPipelineRequest {
  return { ...request, userId };
}

function shapePublicPipelineRequest(rawBody: unknown, userId: string): unknown {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return rawBody;
  }

  if ("pipeline" in rawBody) {
    return rawBody;
  }

  return {
    ...(rawBody as Record<string, unknown>),
    userId
  };
}
