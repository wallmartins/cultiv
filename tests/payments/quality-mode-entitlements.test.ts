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
        { tier: "pro", status: "lapsed" },
        "strict"
      )
    ).toBe(false);
  });

  it("allows quality modes for canceled-in-cycle subscriptions (ADR 0006 §5)", () => {
    // status arriving here is already effective (post lazy clock); "canceled" means still
    // within the paid cycle — a genuinely lapsed cancellation would already read "lapsed".
    expect(canUseQualityMode({ tier: "pro", status: "canceled" }, "strict")).toBe(true);
  });

  it("allows quality modes for trialing and past_due (live-access states)", () => {
    expect(canUseQualityMode({ tier: "pro", status: "trialing" }, "strict")).toBe(true);
    expect(canUseQualityMode({ tier: "pro", status: "past_due" }, "strict")).toBe(true);
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
