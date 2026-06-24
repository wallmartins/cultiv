import { Hono } from "hono";
import {
  BillingCheckoutResponseSchema,
  BillingEntitlementViewSchema,
  decodeBillingCheckoutRequest
} from "@my-ai-orchestrator/contracts";
import { resolveQuotaLimit, resolveQuotaRemaining } from "@my-ai-orchestrator/payments";
import { Routes } from "../app/route-definitions.js";
import type { BackendConfig } from "../config/config.js";
import { BackendBillingNotConfiguredError } from "../http/errors.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import { runEffectOrThrow, validateResponseBody } from "../http/http.js";
import type { BackendProductServices } from "../product.js";

export interface BillingRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerBillingRoutes(app: Hono, options: BillingRouteOptions): void {
  app.post(
    "/me/billing/checkout",
    createPublicRouteHandler({
      route: Routes.PostMeBillingCheckout,
      config: options.config,
      services: options.services,
      decodeInput: decodeBillingCheckoutRequest,
      responseSchema: BillingCheckoutResponseSchema,
      responseSchemaName: "BillingCheckoutResponse",
      handler: async ({ actor, input }) => {
        if (!options.services.billingCheckout) {
          throw new BackendBillingNotConfiguredError({ route: Routes.PostMeBillingCheckout });
        }

        if (input.internalRef === "free") {
          throw new BackendBillingNotConfiguredError({
            route: Routes.PostMeBillingCheckout,
            message: "free plan does not require checkout"
          });
        }

        const email = `${actor.userId}@users.cultiv.app`;
        return runEffectOrThrow(
          options.services.billingCheckout.createCheckout({
            userId: actor.userId,
            email,
            productKind: input.productKind,
            internalRef: input.internalRef,
            currency: input.currency,
            billingPeriod: input.billingPeriod,
            paymentMethod: input.paymentMethod
          })
        );
      }
    })
  );

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

    const canonicalCreditCost = options.services.aiPolicy.getCanonicalCreditCost();
    const plan = options.services.billing.listPlans().find((candidate) => candidate.id === planId);
    const monthlyCredits = plan?.monthlyCredits ?? 0;
    const availableCredits = entitlement.wallet.availableCredits;

    const validated = await validateResponseBody(
      BillingEntitlementViewSchema,
      {
        planId: entitlement.planId,
        tier: entitlement.tier,
        status: entitlement.status,
        availableCredits,
        monthlyCreditsRemaining: entitlement.monthlyCreditsRemaining,
        canonicalCreditCost,
        quotaRemaining: resolveQuotaRemaining(availableCredits, canonicalCreditCost),
        quotaLimit: resolveQuotaLimit(monthlyCredits, canonicalCreditCost)
      },
      "BillingEntitlementView"
    );
    return c.json(validated);
  });
}
