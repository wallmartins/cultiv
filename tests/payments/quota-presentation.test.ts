import { describe, expect, it } from "vitest";
import {
  resolveQuotaCost,
  resolveQuotaLimit,
  resolveQuotaRemaining
} from "../../packages/payments/src/quota-presentation.js";

describe("quota presentation", () => {
  const canonical = 2.5;

  it("converts credit price to quota cost with ceil", () => {
    expect(resolveQuotaCost(2.5, canonical)).toBe(1);
    expect(resolveQuotaCost(3, canonical)).toBe(2);
  });

  it("converts wallet balance to quota remaining with floor", () => {
    expect(resolveQuotaRemaining(10, canonical)).toBe(4);
    expect(resolveQuotaRemaining(2, canonical)).toBe(0);
  });

  it("converts monthly credits to quota limit", () => {
    expect(resolveQuotaLimit(20, canonical)).toBe(8);
  });
});
