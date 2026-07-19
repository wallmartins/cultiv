import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";
import {
  BillingGatewayError,
  createBillingRepository,
  createBillingService,
  DEFAULT_BILLING_PLANS,
  listPlanCatalog,
  type BillingGatewayAdapter
} from "@my-ai-orchestrator/payments";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken, getBackendTestAuthProfile } from "../src/auth/test-auth.js";
import { createBillingCheckoutService } from "../src/product/billing/billing-checkout-service.js";
import { mapBillingError } from "../src/error-mappers/error-map-billing.js";
import { createTestApp, createTestConfig, createMinimalServices } from "./test-helpers.js";

describe("billing routes", () => {
  function createAuthConfig(overrides?: Parameters<typeof createTestConfig>[0]) {
    const profile = getBackendTestAuthProfile();
    return createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl,
      ...overrides
    });
  }

  function createBillingServices(overrides?: Parameters<typeof createMinimalServices>[0]) {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });
    return createMinimalServices({
      billing,
      aiPolicy: {
        getCanonicalCreditCost: () => 1
      } as any,
      ...overrides
    });
  }

  it("GET /me/billing/entitlement backfills trial subscription for existing users", async () => {
    const config = createAuthConfig();
    const users = createBackendApplicationUserMemoryRepository();
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });
    Effect.runSync(
      users.create({
        id: "user-existing",
        externalSubject: "auth0|existing-user",
        status: "active"
      })
    );
    const services = createBillingServices({ billing, users });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|existing-user" });

    const response = await app.request("/me/billing/entitlement", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.planId).toBe("trial");
    expect(body.tier).toBe("pro");
    expect(body.status).toBe("trialing");
    expect(body.availableCredits).toBe(13);
    expect(body.trialEndsAt).toBeTypeOf("string");
    expect(body.management).toEqual({
      canManageViaPortal: false,
      canCancel: false,
      canReactivate: false,
      canChangeMethod: false,
      canRegularize: false,
      regularizeUrl: null
    });
  });

  it("GET /billing/plans returns the public catalog without a `current` marker", async () => {
    const config = createAuthConfig();
    const services = createBillingServices();
    const app = createTestApp(config, services);

    const response = await app.request("/billing/plans");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plans.map((plan: { id: string }) => plan.id)).toEqual(["explorador", "criador", "profissional"]);
    expect(body.plans.every((plan: { current?: boolean }) => plan.current === undefined)).toBe(true);
    expect(body.generationsDisclaimer).toBeTypeOf("string");
  });

  it("GET /me/billing/plans marks the caller's current plan", async () => {
    const config = createAuthConfig();
    const users = createBackendApplicationUserMemoryRepository();
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });
    Effect.runSync(
      users.create({ id: "user-criador", externalSubject: "auth0|criador-user", status: "active" })
    );
    billing.upsertSubscription({
      id: "user-criador:criador:subscription",
      userId: "user-criador",
      planId: "criador",
      status: "active",
      startedAt: new Date().toISOString()
    });
    const services = createBillingServices({ billing, users });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|criador-user" });

    const response = await app.request("/me/billing/plans", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    const criador = body.plans.find((plan: { id: string }) => plan.id === "criador");
    expect(criador.current).toBe(true);
    expect(body.plans.find((plan: { id: string }) => plan.id === "explorador").current).toBe(false);
  });

  it("GET /me/billing/topups returns the seeded top-up package", async () => {
    const config = createAuthConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(
      users.create({ id: "user-topups", externalSubject: "auth0|topups-user", status: "active" })
    );
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });
    billing.registerTopUpPackage({
      id: "topup_500",
      credits: 500,
      priceCents: 2900,
      currency: "BRL",
      description: "500 credits"
    });
    const services = createBillingServices({ billing, users });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|topups-user" });

    const response = await app.request("/me/billing/topups", {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.packages).toContainEqual(
      expect.objectContaining({ id: "topup_500", credits: 500, priceCents: 2900, currency: "BRL" })
    );
  });

  it("POST /me/billing/checkout returns 503 when gateway is not configured", async () => {
    const config = createAuthConfig({
      billingCheckoutSuccessUrl: "https://cultiv.app/app/plans?status=success",
      billingCheckoutCancelUrl: "https://cultiv.app/app/plans?status=cancel"
    });
    const users = createBackendApplicationUserMemoryRepository();
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });
    Effect.runSync(
      users.create({
        id: "user-checkout",
        externalSubject: "auth0|checkout-user",
        status: "active"
      })
    );
    const gatewayStore = {
      findCatalogEntry: () =>
        Effect.succeed(
          Option.some({
            id: "gw-catalog-pro-monthly-brl",
            productKind: "subscription",
            internalRef: "pro",
            currency: "BRL",
            gateway: "asaas",
            billingPeriod: "monthly",
            externalProductId: "price_pro_brl",
            externalPriceId: "price_pro_brl",
            active: true,
            createdAt: new Date().toISOString()
          })
        ),
      createCheckoutIntent: () => Effect.succeed(undefined),
      attachSessionToIntent: () => Effect.succeed(undefined),
      getGatewayCustomer: () => Effect.succeed(Option.none())
    };
    const billingCheckout = createBillingCheckoutService({
      billing,
      gatewayStore: gatewayStore as any,
      config,
      now: () => new Date()
    });
    const services = createBillingServices({ billing, users, billingCheckout });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|checkout-user" });

    const response = await app.request("/me/billing/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productKind: "subscription",
        internalRef: "pro",
        currency: "BRL",
        billingPeriod: "monthly"
      })
    });

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("service_unavailable");
  });

  it("POST /me/billing/checkout matches the catalog view's own internalRef (bare plan id, not a composite string)", async () => {
    const config = createAuthConfig({
      billingCheckoutSuccessUrl: "https://cultiv.app/app/plans?status=success",
      billingCheckoutCancelUrl: "https://cultiv.app/app/plans?status=cancel"
    });
    const users = createBackendApplicationUserMemoryRepository();
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });
    Effect.runSync(
      users.create({
        id: "user-catalog-checkout",
        externalSubject: "auth0|catalog-checkout-user",
        status: "active"
      })
    );

    // the exact same view the frontend reads plan pricing from — this is the handoff under test.
    const catalog = listPlanCatalog({ canonicalCreditCost: 1 });
    const explorador = catalog.plans.find((plan) => plan.id === "explorador");
    if (!explorador) {
      throw new Error("explorador plan missing from the catalog fixture");
    }
    const monthlyBrl = explorador.prices.BRL.monthly;

    // mirrors billing_gateway_catalog rows (migration 0017): bare internal_ref + separate columns.
    const catalogRows = [
      {
        id: "gw-catalog-explorador-monthly-brl",
        productKind: "subscription",
        internalRef: "explorador",
        currency: "BRL",
        gateway: "asaas",
        billingPeriod: "monthly",
        externalProductId: "dev-stub-explorador-monthly-brl",
        externalPriceId: "dev-stub-explorador-monthly-brl",
        active: true,
        createdAt: new Date().toISOString()
      }
    ];
    const gatewayStore = {
      findCatalogEntry: (productKind: string, internalRef: string, currency: string, billingPeriod: string) =>
        Effect.succeed(
          Option.fromNullable(
            catalogRows.find(
              (row) =>
                row.productKind === productKind &&
                row.internalRef === internalRef &&
                row.currency === currency &&
                row.billingPeriod === billingPeriod
            )
          )
        ),
      createCheckoutIntent: (intent: { readonly id: string }) =>
        Effect.succeed({ ...intent, externalSessionId: null, completedAt: null }),
      attachSessionToIntent: () => Effect.succeed(undefined),
      getGatewayCustomer: () => Effect.succeed(Option.none())
    };
    const asaasAdapter: BillingGatewayAdapter = {
      name: "asaas",
      createCheckoutSession: () =>
        Effect.succeed({
          gateway: "asaas",
          sessionId: "sess_test",
          url: "https://asaas.example/checkout/sess_test"
        }),
      charge: () => Effect.fail(new BillingGatewayError({ gateway: "asaas", message: "unused in this test" }))
    };
    const billingCheckout = createBillingCheckoutService({
      billing,
      gatewayStore: gatewayStore as any,
      asaasAdapter,
      config,
      now: () => new Date()
    });
    const services = createBillingServices({ billing, users, billingCheckout });
    const app = createTestApp(config, services);
    const token = createBackendTestAccessToken({ userId: "auth0|catalog-checkout-user" });

    const response = await app.request("/me/billing/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productKind: "subscription",
        internalRef: monthlyBrl.internalRef,
        currency: "BRL",
        billingPeriod: "monthly"
      })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gateway).toBe("asaas");
    expect(body.url).toBe("https://asaas.example/checkout/sess_test");
  });

  it("maps BillingGatewayError to 503 service_unavailable", () => {
    const mapped = mapBillingError(
      new BillingGatewayError({
        gateway: "stripe",
        message: "billing checkout redirect URLs are not configured"
      }),
      "/me/billing/checkout"
    );

    expect(mapped?.status).toBe(503);
    expect(mapped?.body.code).toBe("service_unavailable");
  });
});
