import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { BillingPlanDefinition } from "../../packages/payments/src/types.js";
import { createBillingEntitlement } from "../../packages/payments/src/index.js";
import { defineBillingPlan } from "../../packages/payments/src/plan-validation.js";

describe("billing types module", () => {
  it("imports BillingPlanDefinition from types.ts and createBillingEntitlement via package", () => {
    const plan = Effect.runSync(
      defineBillingPlan({
        id: "pro",
        tier: "pro",
        name: "Pro",
        monthlyCredits: 100,
        features: [{ key: "execution.sync_mode", enabled: true }]
      })
    );

    const typedPlan: BillingPlanDefinition = plan;

    const entitlement = createBillingEntitlement(typedPlan, {
      id: "sub_1",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    expect(entitlement.planId).toBe("pro");
    expect(entitlement.monthlyCreditsRemaining).toBe(100);
  });
});
