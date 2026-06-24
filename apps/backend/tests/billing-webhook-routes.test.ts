import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";
import {
  createAsaasGatewayAdapter,
  createStripeGatewayAdapter,
  signStripeTestWebhook,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import type {
  BillingCheckoutIntent,
  BillingGatewayCatalogEntry,
  PostgresBillingGatewayStore
} from "../src/infra/postgres-billing-gateway-store.js";
import { createBillingWebhookService } from "../src/product/billing/billing-webhook-service.js";
import { createTestApp, createTestConfig, createMinimalServices } from "./test-helpers.js";

const stripeFixturePath = resolve(
  import.meta.dirname,
  "../../../tests/fixtures/billing/stripe-checkout-completed.json"
);
const asaasFixturePath = resolve(
  import.meta.dirname,
  "../../../tests/fixtures/billing/asaas-payment-received.json"
);

const STRIPE_WEBHOOK_SECRET = "whsec_dGVzdA==";
const ASAAS_WEBHOOK_TOKEN = "asaas_test_webhook_token";
const FIXED_NOW = new Date("2026-06-17T12:00:00.000Z");

function signStripePayload(rawBody: string): string {
  return signStripeTestWebhook(rawBody, STRIPE_WEBHOOK_SECRET);
}

function createInMemoryGatewayStore(seed?: {
  readonly intents?: readonly BillingCheckoutIntent[];
}): PostgresBillingGatewayStore {
  const events = new Set<string>();
  const intents = new Map(
    (seed?.intents ?? []).map((intent) => [intent.id, intent] as const)
  );

  return {
    findCatalogEntry: () => Effect.succeed(Option.none<BillingGatewayCatalogEntry>()),
    createCheckoutIntent: (intent) =>
      Effect.succeed({
        ...intent,
        externalSessionId: null,
        completedAt: null
      }),
    completeCheckoutIntent: (id, completedAt) =>
      Effect.sync(() => {
        const intent = intents.get(id);
        if (intent) {
          intents.set(id, { ...intent, status: "completed", completedAt });
        }
      }),
    getCheckoutIntent: (id) => Effect.succeed(Option.fromNullable(intents.get(id))),
    attachSessionToIntent: () => Effect.succeed(undefined),
    upsertGatewayCustomer: () => Effect.succeed(undefined),
    getGatewayCustomer: () => Effect.succeed(Option.none()),
    upsertGatewaySubscription: () => Effect.succeed(undefined),
    recordGatewayEvent: (input) =>
      Effect.succeed(events.has(input.eventId) ? false : (events.add(input.eventId), true))
  };
}

function createWebhookTestContext() {
  const config = createTestConfig();
  const services = createMinimalServices();
  const gatewayStore = createInMemoryGatewayStore({
    intents: [
      {
        id: "chk_test_intent",
        userId: "user_test_1",
        productKind: "subscription",
        internalRef: "pro",
        currency: "BRL",
        gateway: "asaas",
        status: "pending",
        externalSessionId: null,
        createdAt: FIXED_NOW.toISOString(),
        completedAt: null
      }
    ]
  });
  const billingDeps = {
    billing: services.billing,
    gatewayStore,
    stripeAdapter: createStripeGatewayAdapter({
      secretKey: "sk_test_signing_only",
      webhookSecret: STRIPE_WEBHOOK_SECRET
    }),
    asaasAdapter: createAsaasGatewayAdapter({
      apiKey: "asaas_test_api_key",
      webhookToken: ASAAS_WEBHOOK_TOKEN
    }),
    config,
    now: () => FIXED_NOW
  };
  const app = createTestApp(config, {
    ...services,
    billingWebhook: createBillingWebhookService(billingDeps)
  });

  return { app, billing: services.billing };
}

describe("POST /webhooks/stripe", () => {
  const rawBody = readFileSync(stripeFixturePath, "utf8");

  it("returns 4xx for invalid signature", async () => {
    const { app } = createWebhookTestContext();

    const response = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "invalid_signature"
      },
      body: rawBody
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    const body = await response.json();
    expect(body.code).toBe("invalid_request");
  });

  it("returns 200 for valid fixture", async () => {
    const { app, billing } = createWebhookTestContext();

    const response = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signStripePayload(rawBody)
      },
      body: rawBody
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(entitlementFor(billing, "user_test_1", "pro")?.status).toBe("active");
  });

  it("is idempotent on duplicate event id", async () => {
    const { app, billing } = createWebhookTestContext();
    const headers = {
      "Content-Type": "application/json",
      "stripe-signature": signStripePayload(rawBody)
    };

    const first = await app.request("/webhooks/stripe", { method: "POST", headers, body: rawBody });
    const second = await app.request("/webhooks/stripe", { method: "POST", headers, body: rawBody });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(entitlementFor(billing, "user_test_1", "pro")?.wallet.availableCredits).toBe(150);
  });
});

describe("POST /webhooks/asaas", () => {
  const rawBody = readFileSync(asaasFixturePath, "utf8");

  it("returns 4xx for invalid token", async () => {
    const { app } = createWebhookTestContext();

    const response = await app.request("/webhooks/asaas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "asaas-access-token": "wrong_token"
      },
      body: rawBody
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    const body = await response.json();
    expect(body.code).toBe("invalid_request");
  });

  it("returns 200 for valid fixture", async () => {
    const { app, billing } = createWebhookTestContext();

    const response = await app.request("/webhooks/asaas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "asaas-access-token": ASAAS_WEBHOOK_TOKEN
      },
      body: rawBody
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(entitlementFor(billing, "user_test_1", "pro")?.status).toBe("active");
  });

  it("is idempotent on duplicate event id", async () => {
    const { app, billing } = createWebhookTestContext();
    const headers = {
      "Content-Type": "application/json",
      "asaas-access-token": ASAAS_WEBHOOK_TOKEN
    };

    const first = await app.request("/webhooks/asaas", { method: "POST", headers, body: rawBody });
    const second = await app.request("/webhooks/asaas", { method: "POST", headers, body: rawBody });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(entitlementFor(billing, "user_test_1", "pro")?.wallet.availableCredits).toBe(150);
  });
});

function entitlementFor(billing: BillingServiceContract, userId: string, planId: string) {
  return billing.getEntitlement(userId, planId);
}
