import { describe, expect, it, vi } from "vitest";
import { fetchCreditBalance } from "../../apps/web/src/platform/credits/fetch-credit-balance";
import {
  getCachedCreditBalance,
  invalidateCreditBalanceCache
} from "../../apps/web/src/platform/credits/credit-balance-cache";

describe("fetchCreditBalance", () => {
  it("loads available credits from billing entitlement", async () => {
    invalidateCreditBalanceCache();

    const client = {
      billing: {
        getEntitlement: vi.fn()
      },
      toPromise: vi.fn().mockResolvedValue({
        planId: "pro",
        tier: "pro",
        status: "active",
        availableCredits: 2215,
        monthlyCreditsRemaining: 2215
      })
    };

    await expect(fetchCreditBalance(client as never)).resolves.toBe(2215);
    expect(getCachedCreditBalance()).toBe(2215);
    expect(client.toPromise).toHaveBeenCalledTimes(1);
  });
});
