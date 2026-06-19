import { Hono } from "hono";
import { GenerationIntentCatalogViewSchema } from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { buildGenerationIntentCatalogView } from "../product/catalog/generation-intent-catalog.js";
import { Routes } from "../app/route-definitions.js";

export interface GenerationIntentRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerGenerationIntentRoutes(app: Hono, options: GenerationIntentRouteOptions): void {
  app.get("/me/generation-intents", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeGenerationIntents, options.services);
    const voiceProfile = await runEffectOrThrow(options.services.database.voiceProfiles.getByUser(actor.userId));
    const primaryLanguage = voiceProfile?.primaryLanguage ?? options.config.defaultLanguage;
    const items = buildGenerationIntentCatalogView(primaryLanguage);

    const response = await validateResponseBody(
      GenerationIntentCatalogViewSchema,
      { items },
      "GenerationIntentCatalogView"
    );

    return c.json(response);
  });
}
