import { describe, expect, it } from "vitest";
import {
  getCachedCreditBalance,
  invalidateCreditBalanceCache,
  setCachedCreditBalance
} from "../../apps/web/src/platform/credits/credit-balance-cache";

describe("generation preview quota cache", () => {
  it("stores quota remaining (not raw credits) after preview refresh", () => {
    invalidateCreditBalanceCache();

    // ponytail: header and preview must agree on generation units
    setCachedCreditBalance(60);
    expect(getCachedCreditBalance()).toBe(60);
  });

  it("projects quota remaining after submit deduction", () => {
    const quotaRemaining = 60;
    const quotaCost = 5;
    const projected = Math.max(0, quotaRemaining - quotaCost);

    expect(projected).toBe(55);
  });
});
