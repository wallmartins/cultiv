import { describe, expect, it } from "vitest";
import { createBillingRepository, createBillingService } from "@my-ai-orchestrator/payments";
import { ensureBackendBillingSubscription } from "../../apps/backend/src/execution/billing.js";

const NOW = () => new Date("2026-07-24T00:00:00.000Z");

describe("ensureBackendBillingSubscription", () => {
  it("preserves an existing trialing subscription instead of clobbering it to active", () => {
    const billing = createBillingService({ repository: createBillingRepository() });
    billing.upsertSubscription({
      id: "user_1:trial:subscription",
      userId: "user_1",
      planId: "trial",
      status: "trialing",
      startedAt: "2026-07-24T00:00:00.000Z",
      trialEndsAt: "2026-07-31T00:00:00.000Z",
      everSubscribed: false
    });

    ensureBackendBillingSubscription(billing, { userId: "user_1", planId: "trial", generationCycleId: "gen_1" }, NOW);

    const subscription = billing.getSubscription("user_1", "trial");
    expect(subscription?.status).toBe("trialing");
    expect(subscription?.trialEndsAt).toBe("2026-07-31T00:00:00.000Z");
    expect(subscription?.everSubscribed).toBe(false);
  });

  it("creates an active subscription for a service account that has none", () => {
    const billing = createBillingService({ repository: createBillingRepository() });

    ensureBackendBillingSubscription(
      billing,
      { userId: "cultiv-api", planId: "trial", generationCycleId: "gen_1" },
      NOW
    );

    expect(billing.getSubscription("cultiv-api", "trial")?.status).toBe("active");
  });
});
