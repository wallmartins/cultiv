import { describe, expect, it, vi } from "vitest";
import { fetchCreditBalance } from "../../apps/web/src/platform/credits/fetch-credit-balance";
import {
  getCachedCreditBalance,
  invalidateCreditBalanceCache
} from "../../apps/web/src/platform/credits/credit-balance-cache";

describe("fetchCreditBalance", () => {
  it("loads quota remaining from billing entitlement", async () => {
    invalidateCreditBalanceCache();

    const client = {
      billing: {
        getEntitlement: vi.fn()
      },
      toPromise: vi.fn().mockResolvedValue({
        planId: "pro",
        tier: "pro",
        status: "active",
        availableCredits: 150,
        monthlyCreditsRemaining: 150,
        canonicalCreditCost: 2.5,
        quotaRemaining: 60,
        quotaLimit: 60
      })
    };

    await expect(fetchCreditBalance(client as never)).resolves.toBe(60);
    expect(getCachedCreditBalance()).toBe(60);
    expect(client.toPromise).toHaveBeenCalledTimes(1);
  });
});
