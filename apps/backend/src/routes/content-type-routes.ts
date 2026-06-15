import { Hono } from "hono";
import {
  ContentTypeCatalogViewSchema,
  type ContentTypeCatalogView
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { resolveAllowedQualityModes } from "@my-ai-orchestrator/payments";
import { buildContentTypeCatalogView } from "../product/catalog/content-type-catalog.js";
import { resolveCatalogContentTypeDefinitions } from "../product/catalog/resolve-catalog-content-types.js";
import { Routes } from "../app/route-definitions.js";

export interface ContentTypeRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerContentTypeRoutes(app: Hono, options: ContentTypeRouteOptions): void {
  app.get("/me/content-types", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeContentTypes, options.services);
    const userId = actor.userId;
    const voiceProfile = await runEffectOrThrow(options.services.database.voiceProfiles.getByUser(userId));

    const entitlement = options.services.billing.getEntitlement(userId);
    const primaryLanguage = voiceProfile?.primaryLanguage ?? options.config.defaultLanguage;
    const orchestrationCatalog = options.services.aiPolicy.getActiveOrchestrationCatalog();
    const catalogItems = buildContentTypeCatalogView(
      resolveCatalogContentTypeDefinitions(orchestrationCatalog),
      {
        userLanguage: primaryLanguage,
        subscriptionActive: entitlement?.status === "active"
      }
    );
    const planTier = entitlement?.tier ?? "free";

    const response = await validateResponseBody(
      ContentTypeCatalogViewSchema,
      {
        items: catalogItems,
        commercial: {
          planTier,
          allowedQualityModes: [...resolveAllowedQualityModes(planTier)]
        }
      } satisfies ContentTypeCatalogView,
      "ContentTypeCatalogView"
    );

    return c.json(response);
  });
}
