import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createBillingRepository,
  createBillingService,
  DEFAULT_BILLING_PLANS,
  ensureDefaultFreeSubscription
} from "../../packages/payments/src/index.js";

describe("default free subscription", () => {
  it("provisions an active free subscription and entitlement for a new user", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const entitlement = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_new", {
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement.planId).toBe("free");
    expect(entitlement.tier).toBe("free");
    expect(entitlement.status).toBe("active");
    expect(entitlement.wallet.availableCredits).toBe(50);
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

  it("is idempotent for users who already have a subscription", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const first = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_repeat", {
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    billing.consumeCredits("user_repeat", "free", 10, "generation");
    const second = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_repeat", {
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(second.planId).toBe(first.planId);
    expect(second.wallet.availableCredits).toBe(40);
  });
});
