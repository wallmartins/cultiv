import { Hono } from "hono";
import {
  decodeGenerationPrefillRequest,
  type GenerationPrefillResponse,
  GenerationPrefillResponseSchema
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface GenerationPrefillRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerGenerationPrefillRoutes(app: Hono, options: GenerationPrefillRouteOptions): void {
  app.post("/me/generation-prefill", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostMeGenerationPrefill, options.services);
    const rawBody = await readJsonBody(c, Routes.PostMeGenerationPrefill);
    const input = await runEffectOrThrow(decodeGenerationPrefillRequest(rawBody));
    const prefill = await runEffectOrThrow(
      options.services.generationPrefill.infer({ userId: actor.userId, ...input })
    );
    const response = await validateResponseBody(
      GenerationPrefillResponseSchema,
      prefill satisfies GenerationPrefillResponse,
      "GenerationPrefillResponse"
    );

    return c.json(response);
  });
}
