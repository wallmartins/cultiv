import { Schema } from "effect";
import { Hono } from "hono";
import { requireBackendPermission, requireBackendRole } from "../auth/index.js";
import { resolveOperationalActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import { BackendRequestBodyParseError } from "../http/errors.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Permissions, Roles, Routes } from "../app/route-definitions.js";
import {
  OperationalOverrideLifecycleModeSchema,
  OperationalOverrideTargetBoundarySchema,
  OperationalOverrideTargetFamilySchema,
  SafetyClassificationCategorySchema,
  SafetyDecisionOutcomeSchema
} from "../safety/safety-taxonomy-schemas.js";

const OverrideLifecycleSchema = Schema.Union(
  Schema.Struct({
    mode: Schema.Literal("one_shot")
  }),
  Schema.Struct({
    mode: Schema.Literal("time_limited"),
    expiresAt: Schema.String
  })
);

const OverrideScopeSchema = Schema.Struct({
  targetFamily: OperationalOverrideTargetFamilySchema,
  boundary: OperationalOverrideTargetBoundarySchema,
  resourceId: Schema.String,
  targetOutcome: SafetyDecisionOutcomeSchema,
  categories: Schema.Array(SafetyClassificationCategorySchema),
  fields: Schema.Array(Schema.String),
  pipelineName: Schema.optional(Schema.String),
  stepName: Schema.optional(Schema.String)
});

const OverrideRequestSchema = Schema.Struct({
  justification: Schema.String,
  scope: OverrideScopeSchema,
  lifecycle: Schema.optional(OverrideLifecycleSchema)
});

const OverrideDecisionResponseSchema = Schema.Struct({
  overrideId: Schema.String,
  status: Schema.Literal("approved", "rejected"),
  reason: Schema.String,
  operatorId: Schema.String,
  requestedAt: Schema.String,
  scope: OverrideScopeSchema,
  message: Schema.optional(Schema.String),
  lifecycleMode: Schema.optional(OperationalOverrideLifecycleModeSchema),
  expiresAt: Schema.optional(Schema.String),
  remainingUses: Schema.optional(Schema.Number)
});

const OverrideConsumptionResponseSchema = Schema.Struct({
  overrideId: Schema.String,
  status: Schema.Literal("consumed", "active"),
  operatorId: Schema.String,
  consumedAt: Schema.String,
  scope: OverrideScopeSchema,
  lifecycleMode: OperationalOverrideLifecycleModeSchema,
  expiresAt: Schema.optional(Schema.String),
  remainingUses: Schema.Number
});

export interface InternalOverrideRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerInternalOverrideRoutes(app: Hono, options: InternalOverrideRouteOptions): void {
  app.post("/api/internal/safety-overrides", async (c) => {
    const actor = await resolveOperationalActor(c, options.config, Routes.PostInternalSafetyOverrides, options.services);
    await runEffectOrThrow(requireBackendRole(actor, Roles.PlatformAdmin));
    await runEffectOrThrow(requireBackendPermission(actor, Permissions.SafetyOverride));
    const rawBody = await readJsonBody(c, Routes.PostInternalSafetyOverrides);
    const input = await runEffectOrThrow(Schema.decodeUnknown(OverrideRequestSchema)(rawBody));
    const decision = await runEffectOrThrow(
      options.services.operationalOverride.requestOverride({
        operatorId: actor.userId,
        justification: input.justification,
        scope: input.scope,
        lifecycle: input.lifecycle
      })
    );

    const response = await validateResponseBody(
      OverrideDecisionResponseSchema,
      {
        ...decision,
        ...(decision.status === "rejected" ? { message: decision.message } : {})
      },
      "OverrideDecisionResponse"
    );
    return c.json(response);
  });

  app.post("/api/internal/safety-overrides/:overrideId/consume", async (c) => {
    const actor = await resolveOperationalActor(c, options.config, Routes.PostInternalSafetyOverrideConsume, options.services);
    await runEffectOrThrow(requireBackendRole(actor, Roles.PlatformAdmin));
    await runEffectOrThrow(requireBackendPermission(actor, Permissions.SafetyOverride));
    const overrideId = c.req.param("overrideId");
    if (!overrideId || overrideId.trim().length === 0) {
      throw new BackendRequestBodyParseError({
        route: Routes.PostInternalSafetyOverrideConsume,
        message: "Route parameter overrideId is required"
      });
    }

    const response = await runEffectOrThrow(options.services.operationalOverride.consumeOverride(overrideId));
    const validated = await validateResponseBody(
      OverrideConsumptionResponseSchema,
      response,
      "OverrideConsumptionResponse"
    );
    return c.json(validated);
  });
}
