import { describe, expect, it } from "vitest";
import {
  buildScopeForIntent,
  canAdvanceToCompose,
  goBackFromScopeStep,
  withChannel,
  withLengthTier
} from "../../apps/web/src/app/generation/lib/generation-wizard-logic.js";

describe("generation wizard logic", () => {
  it("builds scope with catalog default length tier", () => {
    expect(buildScopeForIntent("long")).toEqual({ lengthTier: "long" });
  });

  it("requires intent and length tier before compose step", () => {
    expect(canAdvanceToCompose("share-idea", { lengthTier: "short" })).toBe(true);
    expect(canAdvanceToCompose(null, { lengthTier: "short" })).toBe(false);
    expect(canAdvanceToCompose("share-idea", null)).toBe(false);
  });

  it("returns to objective step from scope step", () => {
    expect(goBackFromScopeStep(2)).toBe(1);
    expect(goBackFromScopeStep(3)).toBe(3);
  });

  it("updates length tier while preserving channel", () => {
    expect(withLengthTier({ lengthTier: "short", channel: "blog" }, "long")).toEqual({
      lengthTier: "long",
      channel: "blog"
    });
  });

  it("sets channel on empty scope with medium default length", () => {
    expect(withChannel(null, "email")).toEqual({
      lengthTier: "medium",
      channel: "email"
    });
  });
});
