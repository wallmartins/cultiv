import { Hono } from "hono";
import {
  decodeGenerationPreviewRequest,
  type GenerationPreviewRequest,
  type GenerationPreviewResponse,
  GenerationPreviewResponseSchema
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { Routes } from "../app/route-definitions.js";

export interface GenerationPreviewRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerGenerationPreviewRoutes(app: Hono, options: GenerationPreviewRouteOptions): void {
  app.post("/api/generation-preview", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.PostApiGenerationPreview, options.services);
    const rawBody = await readJsonBody(c, Routes.PostApiGenerationPreview);
    const input = await runEffectOrThrow(decodeGenerationPreviewRequest(rawBody));
    const preview = await runEffectOrThrow(options.services.generationPreview.preview({ userId: actor.userId, ...input }));
    const response = await validateResponseBody(
      GenerationPreviewResponseSchema,
      preview satisfies GenerationPreviewResponse,
      "GenerationPreviewResponse"
    );

    return c.json(response);
  });
}
