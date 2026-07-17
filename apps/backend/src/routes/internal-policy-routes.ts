import { Schema } from "effect";
import { Hono } from "hono";
import type { BackendConfig } from "../config/config.js";
import { requireBackendPermission } from "../auth/index.js";
import { resolveOperationalActor } from "../auth/auth-middleware.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes, Permissions } from "../app/route-definitions.js";

const ActivatePolicyRequestSchema = Schema.Struct({
  policyVersion: Schema.String
});

const PolicyVersionSummarySchema = Schema.Struct({
  version: Schema.String,
  lifecycle: Schema.String
});

const ActivePolicyPointerSchema = Schema.Struct({
  activePolicyVersion: Schema.String,
  updatedAt: Schema.String,
  updatedBy: Schema.String,
  history: Schema.Array(
    Schema.Struct({
      policyVersion: Schema.String,
      updatedAt: Schema.String,
      updatedBy: Schema.String
    })
  )
});

const PolicyActivationResponseSchema = Schema.Struct({
  availableVersions: Schema.Array(PolicyVersionSummarySchema),
  activePointer: ActivePolicyPointerSchema,
  recommendation: Schema.optional(
    Schema.Struct({
      recommendedPolicyVersion: Schema.String,
      reason: Schema.String,
      evidence: Schema.Struct({
        degradedProvider: Schema.String,
        failureCount: Schema.Number,
        observedAt: Schema.String
      })
    })
  )
});

export interface InternalPolicyRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerInternalPolicyRoutes(app: Hono, options: InternalPolicyRouteOptions): void {
  app.get("/api/internal/policies", async (c) => {
    const actor = await resolveOperationalActor(c, options.config, Routes.GetInternalPolicies, options.services);
    await runEffectOrThrow(requireBackendPermission(actor, Permissions.AiPolicyActivate));
    const response = await buildPolicyActivationResponse(options.services.aiPolicy);
    return c.json(response);
  });

  app.post("/api/internal/policies/activate", async (c) => {
    const actor = await resolveOperationalActor(c, options.config, Routes.PostInternalPoliciesActivate, options.services);
    await runEffectOrThrow(requireBackendPermission(actor, Permissions.AiPolicyActivate));
    const rawBody = await readJsonBody(c, Routes.PostInternalPoliciesActivate);
    const input = await runEffectOrThrow(Schema.decodeUnknown(ActivatePolicyRequestSchema)(rawBody));
    await runEffectOrThrow(
      options.services.aiPolicy.activatePolicyVersion({
        policyVersion: input.policyVersion,
        actor: actor.userId
      })
    );
    const response = await buildPolicyActivationResponse(options.services.aiPolicy);
    return c.json(response);
  });

  app.post("/api/internal/policies/reload", async (c) => {
    const actor = await resolveOperationalActor(c, options.config, Routes.PostInternalPoliciesReload, options.services);
    await runEffectOrThrow(requireBackendPermission(actor, Permissions.AiPolicyActivate));
    await runEffectOrThrow(options.services.aiPolicy.reloadActivePolicyPointer());
    const response = await buildPolicyActivationResponse(options.services.aiPolicy);
    return c.json(response);
  });
}

async function buildPolicyActivationResponse(aiPolicy: BackendProductServices["aiPolicy"]) {
  const activePointer = await runEffectOrThrow(aiPolicy.getActivePolicyPointer());
  const recommendation = await runEffectOrThrow(aiPolicy.recommendFuturePolicyVersion());
  return validateResponseBody(
    PolicyActivationResponseSchema,
    {
      availableVersions: aiPolicy.listPolicyVersions(),
      activePointer,
      ...(recommendation ? { recommendation } : {})
    },
    "PolicyActivationResponse"
  );
}
