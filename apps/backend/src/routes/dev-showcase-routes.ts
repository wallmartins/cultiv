import { Hono } from "hono";
import type { BackendConfig } from "../config/config.js";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import type { BackendProductServices } from "../product.js";
import { seedUserBillingState } from "../product/billing/billing-bootstrap.js";
import { runEffectOrThrow } from "../http/http.js";

export interface DevShowcaseRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly now: () => Date;
}

export function registerDevShowcaseRoutes(app: Hono, options: DevShowcaseRouteOptions): void {
  if (options.config.environment !== "development") {
    return;
  }

  app.post("/dev/showcase/billing-activate", async (c) => {
    const actor = await resolvePublicActor(
      c,
      options.config,
      "POST /dev/showcase/billing-activate",
      options.services
    );

    await runEffectOrThrow(
      seedUserBillingState(options.services.billing, options.config, actor.userId, options.now)
    );

    const entitlement = options.services.billing.getEntitlement(
      actor.userId,
      options.config.billingPlanId
    );

    return c.json({
      userId: actor.userId,
      planId: options.config.billingPlanId ?? entitlement?.planId ?? null,
      active: entitlement?.canGenerate ?? false,
      availableCredits: entitlement?.wallet.availableCredits ?? 0
    });
  });
}
