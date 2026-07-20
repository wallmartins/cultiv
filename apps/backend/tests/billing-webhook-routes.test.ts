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
    getGatewaySubscription: () => Effect.succeed(Option.none()),
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
        internalRef: "criador",
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
    expect(entitlementFor(billing, "user_test_1", "criador")?.status).toBe("active");
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
    expect(entitlementFor(billing, "user_test_1", "criador")?.wallet.availableCredits).toBe(300);
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
    expect(entitlementFor(billing, "user_test_1", "criador")?.status).toBe("active");
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
    expect(entitlementFor(billing, "user_test_1", "criador")?.wallet.availableCredits).toBe(300);
  });
});

function entitlementFor(billing: BillingServiceContract, userId: string, planId: string) {
  return billing.getEntitlement(userId, planId);
}

// integrity fix — recordGatewayEvent used to run BEFORE dispatch; a dispatch (or side-effect)
// failure still marked the event processed, so the gateway's retry hit isNew=false and gave up,
// permanently losing a paid checkout. This proves the invariant: dispatch failure => retriable.
function createFlakyGatewayStore(options: {
  readonly intents: readonly BillingCheckoutIntent[];
  readonly failUpsertSubscriptionOnAttempt: number;
}): PostgresBillingGatewayStore & { readonly recordedEventIds: ReadonlySet<string> } {
  const events = new Set<string>();
  const intents = new Map(options.intents.map((intent) => [intent.id, intent] as const));
  let upsertSubscriptionAttempts = 0;

  return {
    findCatalogEntry: () => Effect.succeed(Option.none<BillingGatewayCatalogEntry>()),
    createCheckoutIntent: (intent) => Effect.succeed({ ...intent, externalSessionId: null, completedAt: null }),
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
    upsertGatewaySubscription: () => {
      upsertSubscriptionAttempts += 1;
      if (upsertSubscriptionAttempts === options.failUpsertSubscriptionOnAttempt) {
        return Effect.fail(new Error("injected transient failure (test)"));
      }
      return Effect.succeed(undefined);
    },
    getGatewaySubscription: () => Effect.succeed(Option.none()),
    recordGatewayEvent: (input) =>
      Effect.succeed(events.has(input.eventId) ? false : (events.add(input.eventId), true)),
    recordedEventIds: events
  };
}

describe("webhook dedup ordering", () => {
  const rawBody = readFileSync(stripeFixturePath, "utf8");

  it("does not mark a failed dispatch as processed, so a retry re-runs it and succeeds", async () => {
    const config = createTestConfig();
    const services = createMinimalServices();
    const gatewayStore = createFlakyGatewayStore({
      intents: [
        {
          id: "chk_test_intent",
          userId: "user_test_1",
          productKind: "subscription",
          internalRef: "criador",
          currency: "BRL",
          gateway: "asaas",
          status: "pending",
          externalSessionId: null,
          createdAt: FIXED_NOW.toISOString(),
          completedAt: null
        }
      ],
      // upsertGatewaySubscription is the LAST side-effect before recordGatewayEvent — failing
      // it on the first attempt proves the whole pipeline (not just dispatch itself) gates dedup.
      failUpsertSubscriptionOnAttempt: 1
    });
    const billingWebhook = createBillingWebhookService({
      billing: services.billing,
      gatewayStore,
      stripeAdapter: createStripeGatewayAdapter({
        secretKey: "sk_test_signing_only",
        webhookSecret: STRIPE_WEBHOOK_SECRET
      }),
      config,
      now: () => FIXED_NOW
    });
    const app = createTestApp(config, { ...services, billingWebhook });
    const headers = {
      "Content-Type": "application/json",
      "stripe-signature": signStripePayload(rawBody)
    };

    const first = await app.request("/webhooks/stripe", { method: "POST", headers, body: rawBody });
    expect(first.status).toBeGreaterThanOrEqual(500);
    // dispatch itself already ran and succeeded (it's not transactionally coupled to the later
    // gateway-store side-effects) — the point of the fix is that the event isn't marked
    // processed yet, so a gateway retry doesn't bail out early with isNew=false.
    expect(entitlementFor(services.billing, "user_test_1", "criador")?.status).toBe("active");
    expect(gatewayStore.recordedEventIds.has("evt_test_checkout_completed")).toBe(false);

    const second = await app.request("/webhooks/stripe", { method: "POST", headers, body: rawBody });
    expect(second.status).toBe(200);
    expect(gatewayStore.recordedEventIds.has("evt_test_checkout_completed")).toBe(true);
    // dispatch is idempotent (activeCycleId already set) — the retry must not double-grant credits.
    expect(entitlementFor(services.billing, "user_test_1", "criador")?.wallet.availableCredits).toBe(300);
  });
});
