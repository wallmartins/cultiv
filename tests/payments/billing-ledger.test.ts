import { describe, expect, it } from "vitest";
import { createAccountId } from "../../packages/payments/src/billing-utils.js";
import { createWalletFromRepository } from "../../packages/payments/src/ledger.js";
import { createBillingRepository } from "../../packages/payments/src/repository.js";

describe("billing ledger", () => {
  it("createWalletFromRepository projects availableCredits from ledger entries", () => {
    const userId = "user-1";
    const planId = "pro";
    const accountId = createAccountId(userId, planId);
    const subscriptionId = `${userId}:${planId}:subscription`;

    const repository = createBillingRepository({
      subscriptions: [
        {
          id: subscriptionId,
          userId,
          planId,
          status: "active",
          startedAt: "2026-01-01T00:00:00.000Z"
        }
      ],
      cycleStates: [
        {
          cycleId: "cycle-1",
          subscriptionId,
          accountId,
          openedAt: "2026-01-01T00:00:00.000Z",
          closedAt: null,
          rolloverCredits: 0,
          grantedCredits: 2500,
          expiredCredits: 0
        }
      ],
      ledger: [
        {
          accountId,
          subscriptionId,
          entryType: "grant_cycle",
          creditsDelta: 2500,
          balanceAfter: 2500,
          referenceType: "subscription_cycle",
          referenceId: "cycle-1",
          idempotencyKey: "grant",
          metadata: {},
          createdAt: "2026-01-01T00:00:00.000Z"
        },
        {
          accountId,
          subscriptionId,
          entryType: "capture",
          creditsDelta: -150,
          balanceAfter: 2350,
          referenceType: "usage_record",
          referenceId: "usage-1",
          idempotencyKey: "usage-1",
          metadata: {},
          createdAt: "2026-01-02T00:00:00.000Z"
        }
      ]
    });

    const wallet = createWalletFromRepository(repository, userId, planId);

    expect(wallet).toBeDefined();
    expect(wallet!.availableCredits).toBe(2350);
  });
});
