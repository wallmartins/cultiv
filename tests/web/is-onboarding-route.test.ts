import { describe, expect, it } from "vitest";
import { isOnboardingRoute } from "../../apps/web/src/app/auth/lib/is-onboarding-route.js";

describe("isOnboardingRoute", () => {
  it("matches only the onboarding path", () => {
    expect(isOnboardingRoute("/app/onboarding")).toBe(true);
    expect(isOnboardingRoute("/app/generate")).toBe(false);
    expect(isOnboardingRoute("/app/onboarding/extra")).toBe(false);
  });
});
