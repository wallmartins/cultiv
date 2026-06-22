import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { ensureDefaultFreeSubscription } from "../../packages/payments/src/activation.js";
import { DEFAULT_BILLING_PLANS } from "../../packages/payments/src/default-plans.js";
import { createBillingRepository } from "../../packages/payments/src/repository.js";
import { createBillingService } from "../../packages/payments/src/service.js";

describe("billing activation module", () => {
  it("ensureDefaultFreeSubscription creates free subscription for new user", () => {
    const billing = createBillingService({
      repository: createBillingRepository({ plans: DEFAULT_BILLING_PLANS })
    });

    const entitlement = Effect.runSync(
      ensureDefaultFreeSubscription(billing, "user_new", {
        now: () => new Date("2026-06-12T00:00:00.000Z"),
        idempotencyNamespace: "test"
      })
    );

    expect(entitlement?.planId).toBe("free");
    expect(entitlement?.tier).toBe("free");
    expect(entitlement?.status).toBe("active");
    expect(entitlement?.wallet.availableCredits).toBe(20);
  });
});
