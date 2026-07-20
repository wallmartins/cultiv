import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  activateSubscription,
  createBillingRepository,
  createBillingService,
  DEFAULT_BILLING_PLANS,
  ensureDefaultFreeSubscription
} from "../../packages/payments/src/index.js";

describe("default free subscription", () => {
  it("registers criador plan with pro tier and 75 monthly credits", () => {
    const criador = DEFAULT_BILLING_PLANS.find((plan) => plan.id === "criador");
    expect(criador).toMatchObject({
      tier: "pro",
      name: "Criador",
      monthlyCredits: 300
    });
    expect(criador?.dailyCredits).toBeUndefined();
  });

  it("provisions a trialing subscription and entitlement for a new user", () => {
    const fixedNow = new Date("2026-06-12T00:00:00.000Z");
    const billing = createBillingService({
      clock: { now: () => fixedNow },
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const entitlement = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_new", {
        now: () => fixedNow,
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement.planId).toBe("trial");
    expect(entitlement.tier).toBe("pro");
    expect(entitlement.status).toBe("trialing");
    expect(entitlement.wallet.availableCredits).toBe(20);
  });

  it("does not provision free tier when the user already has an unresolved subscription plan", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    billing.upsertSubscription({
      id: "user_orphan:missing-plan:subscription",
      userId: "user_orphan",
      planId: "missing-plan",
      status: "active",
      startedAt: new Date("2026-06-12T00:00:00.000Z").toISOString()
    });

    const entitlement = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_orphan", {
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement).toBeUndefined();
    expect(billing.getEntitlement("user_orphan")).toBeUndefined();
    expect(billing.getPrimarySubscriptionPlanId("user_orphan")).toBe("missing-plan");
  });

  it("opens a billing cycle for an active subscription that was created without startCycle", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    billing.upsertSubscription({
      id: "user_orphan:profissional:subscription",
      userId: "user_orphan_pro",
      planId: "profissional",
      status: "active",
      startedAt: new Date("2026-06-12T00:00:00.000Z").toISOString()
    });

    const entitlement = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_orphan_pro", {
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement?.planId).toBe("profissional");
    expect(entitlement?.wallet.availableCredits).toBe(1000);
    expect(entitlement?.activeCycleId).toBe("user_orphan_pro:profissional:cycle:default");
    expect(billing.listLedger("user_orphan_pro", "profissional")).toHaveLength(1);
    expect(billing.listLedger("user_orphan_pro", "profissional")[0]?.entryType).toBe("grant_cycle");
  });

  it("is idempotent for users who already have a subscription", () => {
    const fixedNow = new Date("2026-06-12T00:00:00.000Z");
    const billing = createBillingService({
      clock: { now: () => fixedNow },
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const first = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_repeat", {
        now: () => fixedNow,
        idempotencyNamespace: "test"
      })
    );

    billing.consumeCredits("user_repeat", "trial", 10, "generation");
    const second = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_repeat", {
        now: () => fixedNow,
        idempotencyNamespace: "test"
      })
    );

    expect(second.planId).toBe(first.planId);
    expect(second.wallet.availableCredits).toBe(10);
  });

  it("activates a paid plan with subscription and cycle in one step", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const entitlement = Effect.runSync(
      activateSubscription(billing, {
        userId: "user_upgrade",
        planId: "profissional",
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement.planId).toBe("profissional");
    expect(entitlement.wallet.availableCredits).toBe(1000);
    expect(billing.getPrimarySubscriptionPlanId("user_upgrade")).toBe("profissional");
  });

  it("activates criador with pro tier quality modes and monthly grant", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const entitlement = Effect.runSync(
      activateSubscription(billing, {
        userId: "user_criador",
        planId: "criador",
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement.planId).toBe("criador");
    expect(entitlement.tier).toBe("pro");
    expect(entitlement.wallet.availableCredits).toBe(300);
  });
});
