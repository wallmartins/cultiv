import { Hono } from "hono";
import { Schema } from "effect";
import {
  type BillingCheckoutRequest,
  type BillingCheckoutResponse,
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
import { ensureUserEntitlement } from "../product/billing/resolve-user-billing.js";
import type { BackendProductServices } from "../product.js";

export interface BillingRouteOptions {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
}

export function registerBillingRoutes(app: Hono, options: BillingRouteOptions): void {
  app.post(
    "/me/billing/checkout",
    createPublicRouteHandler<BillingCheckoutRequest, BillingCheckoutResponse>({
      route: Routes.PostMeBillingCheckout,
      config: options.config,
      services: options.services,
      decodeInput: decodeBillingCheckoutRequest,
      responseSchema: BillingCheckoutResponseSchema as Schema.Schema<BillingCheckoutResponse, unknown, any>,
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
    const entitlement = await runEffectOrThrow(
      ensureUserEntitlement(options.services.billing, actor.userId, {
        now: () => new Date(),
        idempotencyNamespace: options.config.serviceName
      })
    );
    const planId = entitlement.planId;

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
        quotaLimit: resolveQuotaLimit(monthlyCredits, canonicalCreditCost),
        currency: plan?.currency ?? "BRL"
      },
      "BillingEntitlementView"
    );
    return c.json(validated);
  });
}
