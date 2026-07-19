import { describe, expect, it } from "vitest";
import {
  createBillingRepository,
  deriveEffectiveSubscriptionStatus,
  sweepLapsedSubscriptions
} from "../../packages/payments/src/index.js";

const DAY7 = "2026-06-19T00:00:00.000Z"; // trialEndsAt = signup (06-12) + 7d
const BEFORE_DAY7 = new Date("2026-06-18T23:59:59.000Z");
const AFTER_DAY7 = new Date("2026-06-19T00:00:01.000Z");

describe("deriveEffectiveSubscriptionStatus (contract-03 §4 — lazy clock)", () => {
  it("keeps trialing before day 7 with credits remaining", () => {
    expect(
      deriveEffectiveSubscriptionStatus({
        status: "trialing",
        availableCredits: 5,
        now: BEFORE_DAY7,
        trialEndsAt: DAY7
      })
    ).toBe("trialing");
  });

  it("lapses trialing when the pool is exhausted before day 7", () => {
    expect(
      deriveEffectiveSubscriptionStatus({
        status: "trialing",
        availableCredits: 0,
        now: BEFORE_DAY7,
        trialEndsAt: DAY7
      })
    ).toBe("lapsed");
  });

  it("lapses trialing at day 7 even with credits remaining (whichever comes first)", () => {
    expect(
      deriveEffectiveSubscriptionStatus({
        status: "trialing",
        availableCredits: 8,
        now: AFTER_DAY7,
        trialEndsAt: DAY7
      })
    ).toBe("lapsed");
  });

  it("leaves canceled alone before accessUntil", () => {
    expect(
      deriveEffectiveSubscriptionStatus({
        status: "canceled",
        availableCredits: 0,
        now: BEFORE_DAY7,
        accessUntil: DAY7
      })
    ).toBe("canceled");
  });

  it("lapses canceled once accessUntil has passed", () => {
    expect(
      deriveEffectiveSubscriptionStatus({
        status: "canceled",
        availableCredits: 20,
        now: AFTER_DAY7,
        accessUntil: DAY7
      })
    ).toBe("lapsed");
  });

  it("leaves active/past_due untouched regardless of deadlines", () => {
    expect(
      deriveEffectiveSubscriptionStatus({ status: "active", availableCredits: 0, now: AFTER_DAY7, accessUntil: DAY7 })
    ).toBe("active");
    expect(
      deriveEffectiveSubscriptionStatus({ status: "past_due", availableCredits: 0, now: AFTER_DAY7 })
    ).toBe("past_due");
  });
});

describe("sweepLapsedSubscriptions (materializes the lazy transition)", () => {
  it("flips a trial past day 7 into lapsed and fires the onLapse hook", () => {
    const repository = createBillingRepository({
      subscriptions: [
        {
          id: "user_a:trial:subscription",
          userId: "user_a",
          planId: "trial",
          status: "trialing",
          startedAt: "2026-06-12T00:00:00.000Z",
          trialEndsAt: DAY7,
          everSubscribed: false
        }
      ]
    });

    const lapses: string[] = [];
    const results = sweepLapsedSubscriptions(repository, {
      now: () => AFTER_DAY7,
      onLapse: ({ subscription, previousStatus }) => lapses.push(`${subscription.userId}:${previousStatus}`)
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.subscription.status).toBe("lapsed");
    expect(lapses).toEqual(["user_a:trialing"]);
    expect(repository.subscriptions.get("user_a:trial:subscription")?.status).toBe("lapsed");
  });

  it("flips a canceled subscription past accessUntil into lapsed", () => {
    const repository = createBillingRepository({
      subscriptions: [
        {
          id: "user_b:pro:subscription",
          userId: "user_b",
          planId: "pro",
          status: "canceled",
          startedAt: "2026-05-01T00:00:00.000Z",
          expiresAt: DAY7,
          everSubscribed: true
        }
      ]
    });

    const results = sweepLapsedSubscriptions(repository, { now: () => AFTER_DAY7 });

    expect(results).toHaveLength(1);
    expect(results[0]?.previousStatus).toBe("canceled");
    expect(repository.subscriptions.get("user_b:pro:subscription")?.status).toBe("lapsed");
  });

  it("is a no-op when nothing has crossed its deadline yet", () => {
    const repository = createBillingRepository({
      subscriptions: [
        {
          id: "user_c:trial:subscription",
          userId: "user_c",
          planId: "trial",
          status: "trialing",
          startedAt: "2026-06-12T00:00:00.000Z",
          trialEndsAt: DAY7,
          everSubscribed: false
        }
      ]
    });

    const results = sweepLapsedSubscriptions(repository, { now: () => BEFORE_DAY7 });

    expect(results).toHaveLength(0);
    expect(repository.subscriptions.get("user_c:trial:subscription")?.status).toBe("trialing");
  });
});
