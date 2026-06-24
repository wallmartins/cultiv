import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";
import {
  BillingGatewayError,
  createBillingRepository,
  createBillingService,
  DEFAULT_BILLING_PLANS
} from "@my-ai-orchestrator/payments";
import { createBackendApplicationUserMemoryRepository } from "../src/auth/application-user-memory.js";
import { createBackendTestAccessToken, getBackendTestAuthProfile } from "../src/auth/test-auth.js";
import { createBillingCheckoutService } from "../src/product/billing/billing-checkout-service.js";
import { mapBillingError } from "../src/error-mappers/error-map-billing.js";
import { createTestApp, createTestConfig, createMinimalServices } from "./test-helpers.js";

describe("billing routes", () => {
  function createAuthConfig() {
    const profile = getBackendTestAuthProfile();
    return createTestConfig({
      authIssuerUrl: profile.issuerUrl,
      authAudience: profile.audience,
      authJwksUrl: profile.jwksUrl
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

  it("GET /me/billing/entitlement backfills free subscription for existing users", async () => {
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
    expect(body.planId).toBe("free");
    expect(body.tier).toBe("free");
    expect(body.status).toBe("active");
    expect(body.availableCredits).toBe(20);
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
