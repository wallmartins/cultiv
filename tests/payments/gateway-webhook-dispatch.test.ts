import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createBillingRepository,
  createBillingService,
  createStripeGateway,
  defineBillingPlan
} from "../../packages/payments/src/index.js";
import { dispatchGatewayWebhookEvent } from "../../packages/payments/src/gateway/webhook-dispatch.js";

describe("dispatchGatewayWebhookEvent", () => {
  it("activates pro subscription on checkout.completed", async () => {
    const fixedNow = new Date("2026-06-17T12:00:00.000Z");
    const service = createBillingService({
      gateway: createStripeGateway(),
      clock: { now: () => fixedNow },
      repository: createBillingRepository({
        plans: [
          Effect.runSync(
            defineBillingPlan({
              id: "pro",
              tier: "pro",
              name: "Pro",
              monthlyCredits: 150,
              features: [{ key: "execution.sync_mode", enabled: true }]
            })
          )
        ]
      })
    });

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_1",
          gateway: "stripe",
          type: "checkout.completed",
          userId: "user_1",
          amount: 49,
          currency: "USD",
          internalRef: "pro",
          productKind: "subscription"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const entitlement = service.getEntitlement("user_1", "pro");
    expect(entitlement?.status).toBe("active");
    expect(entitlement?.wallet.availableCredits).toBe(150);
  });

  it("activates criador subscription on checkout.completed", async () => {
    const fixedNow = new Date("2026-06-17T12:00:00.000Z");
    const service = createBillingService({
      gateway: createStripeGateway(),
      clock: { now: () => fixedNow },
      repository: createBillingRepository({
        plans: [
          Effect.runSync(
            defineBillingPlan({
              id: "criador",
              tier: "starter",
              name: "Criador",
              monthlyCredits: 63,
              features: [{ key: "execution.sync_mode", enabled: true }]
            })
          )
        ]
      })
    });

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_criador",
          gateway: "stripe",
          type: "checkout.completed",
          userId: "user_criador",
          amount: 24,
          currency: "USD",
          internalRef: "criador",
          productKind: "subscription"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const entitlement = service.getEntitlement("user_criador", "criador");
    expect(entitlement?.status).toBe("active");
    expect(entitlement?.tier).toBe("starter");
    expect(entitlement?.wallet.availableCredits).toBe(63);
  });

  it("starts a new cycle on subscription.renewed", async () => {
    const fixedNow = new Date("2026-06-17T12:00:00.000Z");
    const service = createBillingService({
      gateway: createStripeGateway(),
      clock: { now: () => fixedNow },
      repository: createBillingRepository({
        plans: [
          Effect.runSync(
            defineBillingPlan({
              id: "pro",
              tier: "pro",
              name: "Pro",
              monthlyCredits: 150,
              features: [{ key: "execution.sync_mode", enabled: true }]
            })
          )
        ],
        subscriptions: [
          {
            id: "user_1:pro:subscription",
            userId: "user_1",
            planId: "pro",
            status: "active",
            startedAt: fixedNow.toISOString()
          }
        ]
      })
    });

    await Effect.runPromise(
      service.startCycle({
        userId: "user_1",
        planId: "pro",
        cycleId: "user_1:pro:cycle:initial",
        idempotencyKey: "initial-cycle"
      })
    );

    const before = service.getEntitlement("user_1", "pro")?.wallet.availableCredits;

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_renewal",
          gateway: "stripe",
          type: "subscription.renewed",
          userId: "user_1",
          amount: 49,
          currency: "USD",
          internalRef: "pro"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const after = service.getEntitlement("user_1", "pro")?.wallet.availableCredits;
    expect(after).toBeGreaterThan(before ?? 0);
  });

  it("grants top-up credits on checkout.completed for topup product", async () => {
    const fixedNow = new Date("2026-06-17T12:00:00.000Z");
    const service = createBillingService({
      gateway: createStripeGateway(),
      clock: { now: () => fixedNow },
      repository: createBillingRepository({
        plans: [
          Effect.runSync(
            defineBillingPlan({
              id: "pro",
              tier: "pro",
              name: "Pro",
              monthlyCredits: 150,
              features: [{ key: "execution.sync_mode", enabled: true }]
            })
          )
        ],
        subscriptions: [
          {
            id: "user_1:pro:subscription",
            userId: "user_1",
            planId: "pro",
            status: "active",
            startedAt: fixedNow.toISOString()
          }
        ],
        topUpPackages: [
          {
            id: "topup_500",
            credits: 500,
            priceCents: 2900,
            currency: "BRL",
            description: "500 credits"
          }
        ]
      })
    });

    const before = service.getEntitlement("user_1", "pro")?.wallet.availableCredits ?? 0;

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_topup",
          gateway: "asaas",
          type: "checkout.completed",
          userId: "user_1",
          amount: 29,
          currency: "BRL",
          internalRef: "topup_500",
          productKind: "topup"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const after = service.getEntitlement("user_1", "pro")?.wallet.availableCredits ?? 0;
    expect(after - before).toBe(500);
  });
});
