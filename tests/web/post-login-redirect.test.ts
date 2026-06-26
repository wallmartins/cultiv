import { describe, expect, it } from "vitest";
import { resolvePostLoginPath, shouldEnterOnboarding } from "../../apps/web/src/app/auth/lib/post-login-redirect.js";

describe("resolvePostLoginPath", () => {
  it("sends first-time users without examples to onboarding", () => {
    expect(
      resolvePostLoginPath({
        onboardingComplete: false,
        voiceExampleCount: 0
      })
    ).toBe("/app/onboarding");
  });

  it("sends users with examples to generate", () => {
    expect(
      resolvePostLoginPath({
        onboardingComplete: false,
        voiceExampleCount: 2
      })
    ).toBe("/app/generate");
  });

  it("sends users with completed onboarding to generate", () => {
    expect(
      resolvePostLoginPath({
        onboardingComplete: true,
        voiceExampleCount: 0
      })
    ).toBe("/app/generate");
  });

  it("honors intended app paths when onboarding gate is cleared", () => {
    expect(
      resolvePostLoginPath({
        onboardingComplete: true,
        voiceExampleCount: 0,
        intendedPath: "/app/history"
      })
    ).toBe("/app/history");
  });

  it("keeps gated users on onboarding even with a deep link", () => {
    expect(
      resolvePostLoginPath({
        onboardingComplete: false,
        voiceExampleCount: 0,
        intendedPath: "/app/history"
      })
    ).toBe("/app/onboarding");
  });

  it("honors paid checkout returnTo before onboarding gate", () => {
    expect(
      resolvePostLoginPath({
        onboardingComplete: false,
        voiceExampleCount: 0,
        intendedPath: "/app/plans?checkout=criador&currency=BRL&period=monthly",
      })
    ).toBe("/app/plans?checkout=criador&currency=BRL&period=monthly");
  });
});

describe("shouldEnterOnboarding", () => {
  it("is true only without completion and examples", () => {
    expect(shouldEnterOnboarding({ onboardingComplete: false, voiceExampleCount: 0 })).toBe(true);
    expect(shouldEnterOnboarding({ onboardingComplete: true, voiceExampleCount: 0 })).toBe(false);
    expect(shouldEnterOnboarding({ onboardingComplete: false, voiceExampleCount: 1 })).toBe(false);
  });
});
