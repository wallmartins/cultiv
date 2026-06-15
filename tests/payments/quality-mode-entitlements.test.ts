import { describe, expect, it } from "vitest";
import {
  canUseQualityMode,
  resolveAllowedQualityModes,
  resolveMinimumPlanTierForQualityMode
} from "../../packages/payments/src/quality-mode-entitlements.js";

describe("quality mode entitlements", () => {
  it("maps tiers to the agreed quality mode ladder", () => {
    expect(resolveAllowedQualityModes("free")).toEqual(["fast"]);
    expect(resolveAllowedQualityModes("starter")).toEqual(["fast", "balanced"]);
    expect(resolveAllowedQualityModes("pro")).toEqual(["fast", "balanced", "strict"]);
    expect(resolveAllowedQualityModes("enterprise")).toEqual(["fast", "balanced", "strict"]);
  });

  it("blocks disallowed modes for inactive subscriptions", () => {
    expect(
      canUseQualityMode(
        { tier: "pro", status: "canceled" },
        "strict"
      )
    ).toBe(false);
  });

  it("maps each mode to the minimum plan tier that unlocks it", () => {
    expect(resolveMinimumPlanTierForQualityMode("fast")).toBe("free");
    expect(resolveMinimumPlanTierForQualityMode("balanced")).toBe("starter");
    expect(resolveMinimumPlanTierForQualityMode("strict")).toBe("pro");
  });

  it("allows only fast on free tier", () => {
    const entitlement = { tier: "free" as const, status: "active" as const };

    expect(canUseQualityMode(entitlement, "fast")).toBe(true);
    expect(canUseQualityMode(entitlement, "balanced")).toBe(false);
    expect(canUseQualityMode(entitlement, "strict")).toBe(false);
  });
});
