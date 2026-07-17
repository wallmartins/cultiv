import { describe, expect, it } from "vitest";
import { computeEntitlementGate } from "../../packages/payments/src/entitlement.js";

const NOW = new Date("2026-07-17T12:00:00.000Z");
const PAST = "2026-07-01T00:00:00.000Z";
const FUTURE = "2026-08-01T00:00:00.000Z";

describe("computeEntitlementGate", () => {
  it("trial live: within trialEndsAt and has credits -> ok", () => {
    const result = computeEntitlementGate({
      status: "trialing",
      availableCredits: 5,
      now: NOW,
      trialEndsAt: FUTURE
    });
    expect(result).toEqual({ hasLiveAccess: true, canGenerate: true, gate: "ok" });
  });

  it("trial expired: past trialEndsAt, never subscribed -> trial_expired", () => {
    const result = computeEntitlementGate({
      status: "trialing",
      availableCredits: 5,
      now: NOW,
      trialEndsAt: PAST,
      everSubscribed: false
    });
    expect(result).toEqual({ hasLiveAccess: false, canGenerate: false, gate: "trial_expired" });
  });

  it("active with credits -> ok", () => {
    const result = computeEntitlementGate({
      status: "active",
      availableCredits: 10,
      now: NOW
    });
    expect(result).toEqual({ hasLiveAccess: true, canGenerate: true, gate: "ok" });
  });

  it("active with no credits -> no_credits", () => {
    const result = computeEntitlementGate({
      status: "active",
      availableCredits: 0,
      now: NOW
    });
    expect(result).toEqual({ hasLiveAccess: true, canGenerate: false, gate: "no_credits" });
  });

  it("past_due with credits -> ok (dunning does not block generation)", () => {
    const result = computeEntitlementGate({
      status: "past_due",
      availableCredits: 5,
      now: NOW
    });
    expect(result).toEqual({ hasLiveAccess: true, canGenerate: true, gate: "ok" });
  });

  it("past_due with no credits -> past_due (regularizar)", () => {
    const result = computeEntitlementGate({
      status: "past_due",
      availableCredits: 0,
      now: NOW
    });
    expect(result).toEqual({ hasLiveAccess: true, canGenerate: false, gate: "past_due" });
  });

  it("canceled within paid cycle (accessUntil in the future) -> ok", () => {
    const result = computeEntitlementGate({
      status: "canceled",
      availableCredits: 5,
      now: NOW,
      accessUntil: FUTURE
    });
    expect(result).toEqual({ hasLiveAccess: true, canGenerate: true, gate: "ok" });
  });

  it("lapsed ex-trial (never subscribed) -> trial_expired", () => {
    const result = computeEntitlementGate({
      status: "lapsed",
      availableCredits: 0,
      now: NOW,
      everSubscribed: false
    });
    expect(result).toEqual({ hasLiveAccess: false, canGenerate: false, gate: "trial_expired" });
  });

  it("lapsed ex-subscriber (everSubscribed) -> lapsed", () => {
    const result = computeEntitlementGate({
      status: "lapsed",
      availableCredits: 0,
      now: NOW,
      everSubscribed: true
    });
    expect(result).toEqual({ hasLiveAccess: false, canGenerate: false, gate: "lapsed" });
  });

  it("canceled past accessUntil falls back to the everSubscribed-derived gate", () => {
    const result = computeEntitlementGate({
      status: "canceled",
      availableCredits: 5,
      now: NOW,
      accessUntil: PAST,
      everSubscribed: true
    });
    expect(result).toEqual({ hasLiveAccess: false, canGenerate: false, gate: "lapsed" });
  });
});
