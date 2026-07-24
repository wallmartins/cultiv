import {
  createBillingEntitlement,
  type BillingPlanDefinition,
  type BillingSubscription
} from "@my-ai-orchestrator/payments";
import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { BackendUsageAuthorizationError } from "../src/http/errors.js";
import { enforceUsagePolicyGuards } from "../src/product/usage/usage-policy-guards.js";

const TRIAL_PLAN: BillingPlanDefinition = {
  id: "trial",
  tier: "pro",
  name: "Teste",
  monthlyCredits: 20,
  features: [{ key: "execution.sync_mode", enabled: true }]
};

function entitlementForStatus(status: BillingSubscription["status"]) {
  const now = new Date("2026-07-24T00:00:00.000Z");
  const subscription: BillingSubscription = {
    id: "sub_1",
    userId: "user_1",
    planId: "trial",
    status,
    startedAt: now.toISOString(),
    // future deadlines so the lazy clock keeps trialing/canceled "live"
    trialEndsAt: new Date("2026-08-24T00:00:00.000Z").toISOString(),
    expiresAt: new Date("2026-08-24T00:00:00.000Z").toISOString()
  };
  return createBillingEntitlement(TRIAL_PLAN, subscription, [], now);
}

function runGuard(status: BillingSubscription["status"]) {
  return Effect.runSyncExit(
    enforceUsagePolicyGuards({
      userId: "user_1",
      planId: "trial",
      requestedExecutionMode: "async",
      resolvedExecutionMode: "async",
      entitlement: entitlementForStatus(status),
      model: "any-model",
      allowedModel: true
    })
  );
}

describe("enforceUsagePolicyGuards — live-access statuses", () => {
  it("allows a trial user to generate (regression: trialing must not be rejected as plan_inactive)", () => {
    expect(Exit.isSuccess(runGuard("trialing"))).toBe(true);
  });

  it.each(["active", "past_due", "canceled"] as const)("allows %s (live access)", (status) => {
    expect(Exit.isSuccess(runGuard(status))).toBe(true);
  });

  it("rejects a lapsed plan with reason plan_inactive", () => {
    const exit = runGuard("lapsed");
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
      const error = exit.cause.error;
      expect(error).toBeInstanceOf(BackendUsageAuthorizationError);
      expect(error.reason).toBe("plan_inactive");
    }
  });
});
