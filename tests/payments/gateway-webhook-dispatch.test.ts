import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  BillingPlanNotFoundError,
  createBillingRepository,
  createBillingService,
  defineBillingPlan
} from "../../packages/payments/src/index.js";
import { createStripeGateway } from "./stub-gateways.js";
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

  // contract-03 §3 — runnable check: past_due <-> active nos dois gateways.
  it("flips to past_due on payment.failed then recovers to active on subscription.renewed (Stripe dunning)", async () => {
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
            id: "user_dunning:pro:subscription",
            userId: "user_dunning",
            planId: "pro",
            status: "active",
            startedAt: fixedNow.toISOString(),
            everSubscribed: true
          }
        ]
      })
    });

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_stripe_invoice_failed",
          gateway: "stripe",
          type: "payment.failed",
          userId: "user_dunning",
          amount: 49,
          currency: "USD",
          internalRef: "pro",
          outstandingInvoiceUrl: "https://stripe.example/invoices/hosted_1"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const pastDue = service.getEntitlement("user_dunning", "pro");
    expect(pastDue?.status).toBe("past_due");
    expect(pastDue?.gate).toBe("ok"); // ADR 0006 §5 — dunning com créditos ainda vale (ok), não bloqueia
    expect(pastDue?.everSubscribed).toBe(true); // preservado — upsert faz merge, não recria do zero

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_stripe_invoice_recovered",
          gateway: "stripe",
          type: "subscription.renewed",
          userId: "user_dunning",
          amount: 49,
          currency: "USD",
          internalRef: "pro"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const recovered = service.getEntitlement("user_dunning", "pro");
    expect(recovered?.status).toBe("active");
    expect(recovered?.gate).toBe("ok");
  });

  it("flips to past_due on ASAAS PAYMENT_OVERDUE then recovers to active on PAYMENT_RECEIVED", async () => {
    const fixedNow = new Date("2026-06-17T12:00:00.000Z");
    const service = createBillingService({
      gateway: createStripeGateway(),
      clock: { now: () => fixedNow },
      repository: createBillingRepository({
        plans: [
          Effect.runSync(
            defineBillingPlan({
              id: "explorador",
              tier: "starter",
              name: "Explorador",
              monthlyCredits: 38,
              features: [{ key: "execution.sync_mode", enabled: true }]
            })
          )
        ],
        subscriptions: [
          {
            id: "user_asaas_dunning:explorador:subscription",
            userId: "user_asaas_dunning",
            planId: "explorador",
            status: "active",
            startedAt: fixedNow.toISOString(),
            everSubscribed: true
          }
        ]
      })
    });

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_asaas_overdue",
          gateway: "asaas",
          type: "payment.failed",
          userId: "user_asaas_dunning",
          amount: 49,
          currency: "BRL",
          internalRef: "explorador",
          outstandingInvoiceUrl: "https://asaas.example/i/overdue_1"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    expect(service.getEntitlement("user_asaas_dunning", "explorador")?.status).toBe("past_due");

    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_asaas_received",
          gateway: "asaas",
          type: "subscription.renewed",
          userId: "user_asaas_dunning",
          amount: 49,
          currency: "BRL",
          internalRef: "explorador"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const recovered = service.getEntitlement("user_asaas_dunning", "explorador");
    expect(recovered?.status).toBe("active");
    expect(recovered?.gate).toBe("ok");
  });

  it("sets canceled status with a gateway-crosschecked accessUntil on subscription.cancelled", async () => {
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
            id: "user_cancel:pro:subscription",
            userId: "user_cancel",
            planId: "pro",
            status: "active",
            startedAt: fixedNow.toISOString(),
            everSubscribed: true
          }
        ]
      })
    });

    const periodEndsAt = "2026-07-17T12:00:00.000Z";
    await Effect.runPromise(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_stripe_cancel",
          gateway: "stripe",
          type: "subscription.cancelled",
          userId: "user_cancel",
          amount: 0,
          currency: "USD",
          internalRef: "pro",
          periodEndsAt
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    const canceled = service.getEntitlement("user_cancel", "pro");
    expect(canceled?.status).toBe("canceled");
    expect(canceled?.accessUntil).toBe(periodEndsAt);
    expect(canceled?.gate).toBe("ok"); // ainda no ciclo pago
  });

  // integrity fix — dunning/cancel branches used to skip plan-existence validation entirely
  // (only checkout.completed had the guard); an unresolvable planId silently wrote a corrupt
  // subscription row instead of failing loud.
  it("fails loud with BillingPlanNotFoundError on a dunning event for an unresolvable plan, and writes no subscription", async () => {
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

    const result = await Effect.runPromiseExit(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_stripe_bad_plan",
          gateway: "stripe",
          type: "payment.failed",
          userId: "user_ghost_plan",
          amount: 49,
          currency: "USD",
          internalRef: "plan_that_does_not_exist"
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    expect(result._tag).toBe("Failure");
    if (result._tag === "Failure" && result.cause._tag === "Fail") {
      expect(result.cause.error).toBeInstanceOf(BillingPlanNotFoundError);
      expect((result.cause.error as BillingPlanNotFoundError).planId).toBe("plan_that_does_not_exist");
    }

    expect(service.getEntitlement("user_ghost_plan", "plan_that_does_not_exist")).toBeUndefined();
    expect(service.getPrimarySubscriptionPlanId("user_ghost_plan")).toBeUndefined();
  });

  // the branch the earlier test doesn't cover: no internalRef at all AND no primary
  // subscription to fall back to. Fixing the guard by swapping `?? "pro"` for
  // `?? DEFAULT_TRIAL_PLAN_ID` was itself a bug — "trial" is a REAL registered plan, so the
  // existence guard would trivially pass and silently fabricate a phantom trialing subscription
  // (no trialEndsAt, so the lapse clock never applies) for an event that resolved to nothing.
  it("fails loud with BillingPlanNotFoundError when a dunning event has no internalRef and no primary subscription to fall back to", async () => {
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

    const result = await Effect.runPromiseExit(
      dispatchGatewayWebhookEvent(
        service,
        {
          eventId: "evt_asaas_unknown_user",
          gateway: "asaas",
          type: "payment.failed",
          userId: "unknown", // ASAAS dunning callback w/ no application_user_id metadata echoed back
          amount: 49,
          currency: "BRL"
          // no internalRef — the event never resolved to a checkout intent
        },
        { now: () => fixedNow, idempotencyNamespace: "test" }
      )
    );

    expect(result._tag).toBe("Failure");
    if (result._tag === "Failure" && result.cause._tag === "Fail") {
      expect(result.cause.error).toBeInstanceOf(BillingPlanNotFoundError);
      expect((result.cause.error as BillingPlanNotFoundError).planId).toBe("unresolved");
    }

    expect(service.getPrimarySubscriptionPlanId("unknown")).toBeUndefined();
    expect(service.getEntitlement("unknown", "trial")).toBeUndefined();
  });
});
