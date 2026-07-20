import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { ensureDefaultFreeSubscription } from "../../packages/payments/src/activation.js";
import { DEFAULT_BILLING_PLANS } from "../../packages/payments/src/default-plans.js";
import { createBillingRepository } from "../../packages/payments/src/repository.js";
import { createBillingService } from "../../packages/payments/src/service.js";

describe("billing activation module", () => {
  it("ensureDefaultFreeSubscription creates trial subscription for new user", () => {
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

    expect(entitlement?.planId).toBe("trial");
    expect(entitlement?.tier).toBe("pro");
    expect(entitlement?.status).toBe("trialing");
    expect(entitlement?.trialEndsAt).toBe("2026-06-19T00:00:00.000Z");
    expect(entitlement?.wallet.availableCredits).toBe(20);
  });
});
