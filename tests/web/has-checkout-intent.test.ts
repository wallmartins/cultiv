import { describe, expect, it } from "vitest";
import { hasCheckoutIntent } from "../../apps/web/src/marketing/auth/has-checkout-intent.js";

describe("hasCheckoutIntent", () => {
  it("is true for plans checkout returnTo", () => {
    expect(hasCheckoutIntent("/app/plans?checkout=criador&currency=BRL&period=monthly")).toBe(true);
  });

  it("is false for generate returnTo", () => {
    expect(hasCheckoutIntent("/app/generate")).toBe(false);
  });
});
