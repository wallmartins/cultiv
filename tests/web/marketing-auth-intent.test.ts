import { describe, expect, it } from "vitest";
import {
  buildMarketingConversionUrl,
  buildPlansCheckoutPath,
} from "../../apps/web/src/marketing/auth/marketing-auth-intent.js";

describe("buildPlansCheckoutPath", () => {
  it("builds checkout search for criador", () => {
    expect(
      buildPlansCheckoutPath({
        plan: "criador",
        currency: "BRL",
        period: "monthly",
      })
    ).toBe("/app/plans?checkout=criador&currency=BRL&period=monthly");
  });
});

describe("buildMarketingConversionUrl", () => {
  it("returns generate path for free intent when authenticated", () => {
    expect(
      buildMarketingConversionUrl(
        { plan: "free", currency: "BRL", period: "monthly" },
        { isAuthenticated: true }
      )
    ).toBe("/app/generate");
  });

  it("returns login with returnTo for unauthenticated paid intent", () => {
    const url = buildMarketingConversionUrl(
      { plan: "pro", currency: "USD", period: "annual" },
      { isAuthenticated: false }
    );
    expect(url).toBe(
      "/login?returnTo=%2Fapp%2Fplans%3Fcheckout%3Dpro%26currency%3DUSD%26period%3Dannual"
    );
  });

  it("returns direct checkout when authenticated", () => {
    expect(
      buildMarketingConversionUrl(
        { plan: "criador", currency: "BRL", period: "monthly" },
        { isAuthenticated: true }
      )
    ).toBe("/app/plans?checkout=criador&currency=BRL&period=monthly");
  });
});
