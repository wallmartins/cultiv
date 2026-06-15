import { Effect } from "effect";
import { Hono } from "hono";
import {
  JobCreatedResponseSchema,
  RunResponseSchema,
  decodePipelineRequest,
  type JobCreatedResponse,
  type RunResponse
} from "@my-ai-orchestrator/contracts";
import { requireBackendRole } from "../auth/index.js";
import { resolveOperationalActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import {
  BackendExperimentalAccessError,
  BackendRequestBodyParseError
} from "../http/errors.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes, Roles } from "../app/route-definitions.js";

export interface ExperimentalExecutionRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly execution: import("../execution.js").BackendExecutionService;
}

export function registerExperimentalExecutionRoutes(
  app: Hono,
  options: ExperimentalExecutionRouteOptions
): void {
  app.post("/api/internal/experimental/run", async (c) => {
    const actor = await resolveOperationalActor(c, options.config, Routes.PostInternalExperimentalRun, options.services);
    await runEffectOrThrow(authorizeExperimentalExecution(actor, options));
    const experimentalAIPolicy = options.services.experimentalAIPolicy;
    if (!experimentalAIPolicy) {
      throw new BackendExperimentalAccessError({
        reason: "catalog_unavailable",
        message: "Experimental AI policy catalog is not available"
      });
    }

    const rawBody = await readJsonBody(c, Routes.PostInternalExperimentalRun);
    const request = await runEffectOrThrow(decodePipelineRequest(rawBody));
    if (!("pipeline" in request)) {
      throw new BackendRequestBodyParseError({
        route: Routes.PostInternalExperimentalRun,
        message: "Experimental debug flow requires an explicit pipeline request"
      });
    }

    const planTier =
      options.services.billing.getEntitlement(actor.userId, options.config.billingPlanId)?.tier ?? "free";
    const executionSnapshot = await runEffectOrThrow(
      experimentalAIPolicy.resolveExecutionSnapshot({
        request,
        planTier,
        executionMode: options.config.executionMode,
        qualityMode: options.config.qualityMode,
        defaultLanguage: options.config.defaultLanguage
      })
    );
    const response = await runEffectOrThrow(
      options.execution.executeTrusted(executionSnapshot, { simulateCredits: true })
    );

    if ("jobId" in response) {
      const validated = await validateResponseBody(
        JobCreatedResponseSchema,
        response satisfies JobCreatedResponse,
        "JobCreatedResponse"
      );
      return c.json(validated, 202);
    }

    const validated = await validateResponseBody(
      RunResponseSchema,
      response satisfies RunResponse,
      "RunResponse"
    );
    return c.json(validated);
  });
}

function authorizeExperimentalExecution(
  actor: import("../auth/index.js").BackendAuthenticatedActor,
  options: ExperimentalExecutionRouteOptions
) {
  return runExperimentalAccessChecks({
    actor,
    config: options.config,
    featureFlags: options.services.featureFlags
  });
}

function runExperimentalAccessChecks(args: {
  readonly actor: import("../auth/index.js").BackendAuthenticatedActor;
  readonly config: BackendConfig;
  readonly featureFlags: BackendProductServices["featureFlags"];
}) {
  if (args.config.environment === "production") {
    return Effect.fail(
      new BackendExperimentalAccessError({
        reason: "environment_blocked",
        message: "Experimental debug flow is not available in production"
      })
    );
  }

  return requireBackendRole(args.actor, Roles.Staff).pipe(
    Effect.mapError(
      () =>
        new BackendExperimentalAccessError({
          reason: "missing_role",
          message: `Experimental debug flow requires role ${Roles.Staff}`
        })
    ),
    Effect.flatMap(() => {
      const enabled = args.featureFlags.isEnabled("execution.experimental_debug", {
        environment: args.config.environment,
        userId: args.actor.userId,
        tags: [...args.actor.roles]
      });
      if (!enabled) {
        return Effect.fail(
          new BackendExperimentalAccessError({
            reason: "feature_disabled",
            message: "Experimental debug flow is disabled by feature flags"
          })
        );
      }

      return Effect.void;
    })
  );
}
