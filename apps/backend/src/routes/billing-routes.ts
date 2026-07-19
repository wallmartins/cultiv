import { Hono, type Context } from "hono";
import { Effect, Option, Schema } from "effect";
import {
  type BillingCheckoutRequest,
  type BillingCheckoutResponse,
  type BillingEntitlementView,
  type BillingManagement,
  type BillingPaymentMethodInfo,
  type BillingPortalSessionResponse,
  type CheckoutStatusView,
  type LedgerStatementView,
  BillingCheckoutResponseSchema,
  BillingEntitlementViewSchema,
  BillingPortalSessionResponseSchema,
  BillingTopUpCatalogViewSchema,
  CheckoutStatusViewSchema,
  LedgerStatementViewSchema,
  PlanCatalogViewSchema,
  decodeBillingCheckoutRequest
} from "@my-ai-orchestrator/contracts";
import {
  curateLedger,
  listPlanCatalog,
  resolveQuotaLimit,
  resolveQuotaRemaining,
  type BillingEntitlement
} from "@my-ai-orchestrator/payments";
import { Routes } from "../app/route-definitions.js";
import type { BackendConfig } from "../config/config.js";
import { BackendBillingNotConfiguredError, BackendRequestBodyParseError } from "../http/errors.js";
import { createPublicRouteHandler } from "../http/public-route.js";
import { resolvePublicActor } from "../auth/auth-middleware.js";
import { runEffectOrThrow, validateResponseBody } from "../http/http.js";
import { ensureUserEntitlement } from "../product/billing/resolve-user-billing.js";
import type { PostgresBillingGatewayStore } from "../infra/postgres-billing-gateway-store.js";
import type { BackendProductServices } from "../product.js";

// gateway payment method is postgres-only infra; payments' BillingEntitlement always mirrors it as null (see entitlement.ts)
function resolveEntitlementPaymentMethod(
  gatewayStore: PostgresBillingGatewayStore | undefined,
  subscriptionId: string
): Promise<BillingPaymentMethodInfo | null> {
  if (!gatewayStore) {
    return Promise.resolve(null);
  }

  return Effect.runPromise(
    gatewayStore.getGatewaySubscription(subscriptionId).pipe(
      Effect.orElseSucceed(() => Option.none()),
      Effect.map((option) => {
        if (Option.isNone(option) || !option.value.paymentMethodKind) {
          return null;
        }
        const subscription = option.value;
        return {
          kind: subscription.paymentMethodKind,
          gateway: subscription.gateway,
          ...(subscription.paymentMethodBrandLast4
            ? { brandLast4: subscription.paymentMethodBrandLast4 }
            : {})
        } as BillingPaymentMethodInfo;
      })
    )
  );
}

const EMPTY_MANAGEMENT: BillingManagement = {
  canManageViaPortal: false,
  canCancel: false,
  canReactivate: false,
  canChangeMethod: false,
  canRegularize: false,
  regularizeUrl: null
};

const LIVE_CANCEL_STATUSES = new Set(["active", "trialing", "past_due"]);

// contract-03 §1 — flags por gateway×estado; a presença (ou não) de uma linha em
// billing_gateway_subscriptions já distingue ASAAS mensal (cancelável) de anual (nada a
// cancelar, checkout via /payments não gera subscription no gateway).
function resolveEntitlementManagement(
  gatewayStore: PostgresBillingGatewayStore | undefined,
  subscriptionId: string,
  status: string
): Promise<BillingManagement> {
  if (!gatewayStore) {
    return Promise.resolve(EMPTY_MANAGEMENT);
  }

  return Effect.runPromise(
    gatewayStore.getGatewaySubscription(subscriptionId).pipe(
      Effect.orElseSucceed(() => Option.none()),
      Effect.map((option) => {
        if (Option.isNone(option)) {
          return EMPTY_MANAGEMENT;
        }
        const subscription = option.value;
        const canCancel = subscription.gateway === "asaas" && LIVE_CANCEL_STATUSES.has(status);
        const canRegularize = status === "past_due" && Boolean(subscription.outstandingInvoiceUrl);
        return {
          canManageViaPortal: subscription.gateway === "stripe",
          canCancel,
          canReactivate: false,
          canChangeMethod: false,
          canRegularize,
          regularizeUrl: canRegularize ? subscription.outstandingInvoiceUrl ?? null : null
        } satisfies BillingManagement;
      })
    )
  );
}

async function buildEntitlementViewPayload(
  services: BackendProductServices,
  entitlement: BillingEntitlement
): Promise<BillingEntitlementView> {
  const canonicalCreditCost = services.aiPolicy.getCanonicalCreditCost();
  const plan = services.billing.listPlans().find((candidate) => candidate.id === entitlement.planId);
  const monthlyCredits = plan?.monthlyCredits ?? 0;
  const availableCredits = entitlement.wallet.availableCredits;
  const [paymentMethod, management] = await Promise.all([
    resolveEntitlementPaymentMethod(services.billingGatewayStore, entitlement.wallet.subscriptionId),
    resolveEntitlementManagement(services.billingGatewayStore, entitlement.wallet.subscriptionId, entitlement.status)
  ]);

  return {
    planId: entitlement.planId,
    tier: entitlement.tier,
    status: entitlement.status,
    availableCredits,
    monthlyCreditsRemaining: entitlement.monthlyCreditsRemaining,
    canonicalCreditCost,
    quotaRemaining: resolveQuotaRemaining(availableCredits, canonicalCreditCost),
    quotaLimit: resolveQuotaLimit(monthlyCredits, canonicalCreditCost),
    currency: plan?.currency ?? "BRL",
    canGenerate: entitlement.canGenerate,
    canRefine: entitlement.canRefine,
    gate: entitlement.gate,
    ...(entitlement.trialEndsAt ? { trialEndsAt: entitlement.trialEndsAt } : {}),
    ...(entitlement.renewsAt ? { renewsAt: entitlement.renewsAt } : {}),
    ...(entitlement.accessUntil ? { accessUntil: entitlement.accessUntil } : {}),
    paymentMethod,
    management
  };
}

function requireRouteParam(c: Context, name: string): string {
  const value = c.req.param(name);
  if (!value || value.trim().length === 0) {
    throw new BackendRequestBodyParseError({
      route: c.req.path,
      message: `Route parameter ${name} is required`
    });
  }

  return value;
}

const STATEMENT_DEFAULT_LIMIT = 20;
const STATEMENT_MAX_LIMIT = 100;

function parseNonNegativeIntegerParam(value: string | undefined, fallback: number, field: string, route: string): number {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BackendRequestBodyParseError({
      route,
      message: `Query parameter ${field} must be a non-negative integer`
    });
  }

  return parsed;
}

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

        // ADR 0006 §2 removeu o plano "free"; o trial (id "trial") sucede-o e também não
        // passa por checkout — só os planos pagos do catálogo (explorador/criador/profissional).
        if (input.internalRef === "trial") {
          throw new BackendBillingNotConfiguredError({
            route: Routes.PostMeBillingCheckout,
            message: "trial plan does not require checkout"
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

    const validated = await validateResponseBody(
      BillingEntitlementViewSchema,
      await buildEntitlementViewPayload(options.services, entitlement),
      "BillingEntitlementView"
    );
    return c.json(validated);
  });

  app.get("/me/billing/statement", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeBillingStatement, options.services);
    const entitlement = await runEffectOrThrow(
      ensureUserEntitlement(options.services.billing, actor.userId, {
        now: () => new Date(),
        idempotencyNamespace: options.config.serviceName
      })
    );

    const query = c.req.query();
    const limit = Math.min(
      parseNonNegativeIntegerParam(query.limit, STATEMENT_DEFAULT_LIMIT, "limit", Routes.GetMeBillingStatement),
      STATEMENT_MAX_LIMIT
    );
    const offset = parseNonNegativeIntegerParam(query.offset, 0, "offset", Routes.GetMeBillingStatement);

    // curate-then-slice (contract-05 §3): paginating the raw ledger first would split
    // reserve/capture/release pairs across a page boundary.
    const items = curateLedger(options.services.billing.listLedger(actor.userId, entitlement.planId));
    const validated = await validateResponseBody(
      LedgerStatementViewSchema,
      {
        items: items.slice(offset, offset + limit),
        total: items.length,
        limit,
        offset
      } satisfies LedgerStatementView,
      "LedgerStatementView"
    );
    return c.json(validated);
  });

  app.post(
    "/me/billing/portal-session",
    createPublicRouteHandler<BillingPortalSessionResponse>({
      route: Routes.PostMeBillingPortalSession,
      config: options.config,
      services: options.services,
      responseSchema: BillingPortalSessionResponseSchema as Schema.Schema<BillingPortalSessionResponse, unknown, any>,
      responseSchemaName: "BillingPortalSessionResponse",
      handler: async ({ actor }) => {
        if (!options.services.billingLifecycle) {
          throw new BackendBillingNotConfiguredError({ route: Routes.PostMeBillingPortalSession });
        }
        if (!options.config.billingPortalReturnUrl) {
          throw new BackendBillingNotConfiguredError({
            route: Routes.PostMeBillingPortalSession,
            message: "billing portal return URL is not configured"
          });
        }

        return runEffectOrThrow(
          options.services.billingLifecycle.createPortalSession(actor.userId, options.config.billingPortalReturnUrl)
        );
      }
    })
  );

  app.post(
    "/me/billing/subscription/cancel",
    createPublicRouteHandler<BillingEntitlementView>({
      route: Routes.PostMeBillingSubscriptionCancel,
      config: options.config,
      services: options.services,
      responseSchema: BillingEntitlementViewSchema as Schema.Schema<BillingEntitlementView, unknown, any>,
      responseSchemaName: "BillingEntitlementView",
      handler: async ({ actor }) => {
        if (!options.services.billingLifecycle) {
          throw new BackendBillingNotConfiguredError({ route: Routes.PostMeBillingSubscriptionCancel });
        }

        const entitlement = await runEffectOrThrow(
          options.services.billingLifecycle.cancelSubscription(actor.userId)
        );
        return buildEntitlementViewPayload(options.services, entitlement);
      }
    })
  );

  app.get(
    "/me/billing/checkout-status/:intentId",
    createPublicRouteHandler<CheckoutStatusView>({
      route: Routes.GetMeBillingCheckoutStatus,
      config: options.config,
      services: options.services,
      responseSchema: CheckoutStatusViewSchema as Schema.Schema<CheckoutStatusView, unknown, any>,
      responseSchemaName: "CheckoutStatusView",
      handler: async ({ c, actor }) => {
        if (!options.services.billingLifecycle) {
          throw new BackendBillingNotConfiguredError({ route: Routes.GetMeBillingCheckoutStatus });
        }

        const intentId = requireRouteParam(c, "intentId");
        return runEffectOrThrow(options.services.billingLifecycle.getCheckoutStatus(actor.userId, intentId));
      }
    })
  );

  // público — a landing consome no build (ADR 0006 §6); sem resolvePublicActor, catálogo não tem dono.
  app.get("/billing/plans", async (c) => {
    const canonicalCreditCost = options.services.aiPolicy.getCanonicalCreditCost();
    const validated = await validateResponseBody(
      PlanCatalogViewSchema,
      listPlanCatalog({ canonicalCreditCost }),
      "PlanCatalogView"
    );
    return c.json(validated);
  });

  app.get("/me/billing/plans", async (c) => {
    const actor = await resolvePublicActor(c, options.config, Routes.GetMeBillingPlans, options.services);
    const canonicalCreditCost = options.services.aiPolicy.getCanonicalCreditCost();
    const currentPlanId = options.services.billing.getPrimarySubscriptionPlanId(actor.userId);
    const validated = await validateResponseBody(
      PlanCatalogViewSchema,
      listPlanCatalog({ canonicalCreditCost, currentPlanId }),
      "PlanCatalogView"
    );
    return c.json(validated);
  });

  app.get("/me/billing/topups", async (c) => {
    await resolvePublicActor(c, options.config, Routes.GetMeBillingTopups, options.services);
    const validated = await validateResponseBody(
      BillingTopUpCatalogViewSchema,
      { packages: options.services.billing.listTopUpPackages() },
      "BillingTopUpCatalogView"
    );
    return c.json(validated);
  });
}
