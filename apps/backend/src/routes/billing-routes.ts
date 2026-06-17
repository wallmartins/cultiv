import { Hono } from "hono";
import {
  BillingCheckoutResponseSchema,
  BillingEntitlementViewSchema,
  decodeBillingCheckoutRequest
} from "@my-ai-orchestrator/contracts";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import { Routes } from "../app/route-definitions.js";
import type { BackendConfig } from "../config/config.js";
import { BackendBillingNotConfiguredError } from "../http/errors.js";
import { readJsonBody, runEffectOrThrow, validateResponseBody } from "../http/http.js";
import type { BackendProductServices } from "../product.js";

export interface BillingRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerBillingRoutes(app: Hono, options: BillingRouteOptions): void {
  app.post("/me/billing/checkout", async (c) => {
    const actor = await resolvePublicActor(
      c,
      options.config,
      Routes.PostMeBillingCheckout,
      options.services
    );
    if (!options.services.billingCheckout) {
      throw new BackendBillingNotConfiguredError({ route: Routes.PostMeBillingCheckout });
    }

    const rawBody = await readJsonBody(c, Routes.PostMeBillingCheckout);
    const request = await runEffectOrThrow(decodeBillingCheckoutRequest(rawBody));
    if (request.internalRef === "free") {
      throw new BackendBillingNotConfiguredError({
        route: Routes.PostMeBillingCheckout,
        message: "free plan does not require checkout"
      });
    }

    const email = `${actor.userId}@users.cultiv.app`;
    const response = await runEffectOrThrow(
      options.services.billingCheckout.createCheckout({
        userId: actor.userId,
        email,
        productKind: request.productKind,
        internalRef: request.internalRef,
        currency: request.currency,
        billingPeriod: request.billingPeriod
      })
    );

    const validated = await validateResponseBody(
      BillingCheckoutResponseSchema,
      response,
      "BillingCheckoutResponse"
    );
    return c.json(validated);
  });

  app.get("/me/billing/entitlement", async (c) => {
    const actor = await resolvePublicActor(
      c,
      options.config,
      Routes.GetMeBillingEntitlement,
      options.services
    );
    const planId = options.services.billing.getPrimarySubscriptionPlanId(actor.userId) ?? "free";
    const entitlement = options.services.billing.getEntitlement(actor.userId, planId);
    if (!entitlement) {
      throw new BackendBillingNotConfiguredError({
        route: Routes.GetMeBillingEntitlement,
        message: "billing entitlement not found"
      });
    }

    const validated = await validateResponseBody(
      BillingEntitlementViewSchema,
      {
        planId: entitlement.planId,
        tier: entitlement.tier,
        status: entitlement.status,
        availableCredits: entitlement.wallet.availableCredits,
        monthlyCreditsRemaining: entitlement.monthlyCreditsRemaining
      },
      "BillingEntitlementView"
    );
    return c.json(validated);
  });
}
