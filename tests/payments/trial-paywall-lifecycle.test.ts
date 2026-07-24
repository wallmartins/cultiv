import { describe, expect, it } from "vitest";
import {
  createBillingEntitlement,
  type BillingPlanDefinition,
  type BillingSubscription,
  type BillingUsageRecord
} from "@my-ai-orchestrator/payments";

// Trial premise: bounded by BOTH a generation pool (credits) AND a 7-day window;
// the paywall (gate: "trial_expired") fires when whichever limit is reached first.
const TRIAL_PLAN: BillingPlanDefinition = {
  id: "trial",
  tier: "pro",
  name: "Teste",
  monthlyCredits: 20, // ceil(8 generations x 2.5 canonical credit cost)
  features: [{ key: "content.language.refinement", enabled: true }]
};

const SIGNUP = "2026-06-12T00:00:00.000Z";
const TRIAL_ENDS_AT = "2026-06-19T00:00:00.000Z"; // signup + 7d
const WITHIN_WINDOW = new Date("2026-06-15T00:00:00.000Z");
const AFTER_WINDOW = new Date("2026-06-20T00:00:00.000Z");

function trialSubscription(): BillingSubscription {
  return {
    id: "user_trial:trial:subscription",
    userId: "user_trial",
    planId: "trial",
    status: "trialing",
    startedAt: SIGNUP,
    trialEndsAt: TRIAL_ENDS_AT,
    everSubscribed: false
  };
}

function usageConsuming(credits: number): BillingUsageRecord[] {
  return [
    {
      id: "usage_1",
      userId: "user_trial",
      subscriptionId: "user_trial:trial:subscription",
      planId: "trial",
      kind: "generation",
      amount: credits,
      credits,
      createdAt: "2026-06-13T00:00:00.000Z"
    }
  ];
}

describe("trial paywall lifecycle (whichever limit comes first)", () => {
  it("generates while within the window AND with generations left", () => {
    const entitlement = createBillingEntitlement(TRIAL_PLAN, trialSubscription(), usageConsuming(5), WITHIN_WINDOW);
    expect(entitlement.status).toBe("trialing");
    expect(entitlement.canGenerate).toBe(true);
    expect(entitlement.gate).toBe("ok");
    expect(entitlement.monthlyCreditsRemaining).toBe(15);
  });

  it("paywalls when the generation pool is exhausted first (still within the 7-day window)", () => {
    const entitlement = createBillingEntitlement(TRIAL_PLAN, trialSubscription(), usageConsuming(20), WITHIN_WINDOW);
    expect(entitlement.status).toBe("lapsed");
    expect(entitlement.canGenerate).toBe(false);
    expect(entitlement.gate).toBe("trial_expired");
  });

  it("paywalls when the 7-day window elapses first (generations still remaining)", () => {
    const entitlement = createBillingEntitlement(TRIAL_PLAN, trialSubscription(), usageConsuming(5), AFTER_WINDOW);
    expect(entitlement.status).toBe("lapsed");
    expect(entitlement.canGenerate).toBe(false);
    expect(entitlement.gate).toBe("trial_expired");
  });
});
