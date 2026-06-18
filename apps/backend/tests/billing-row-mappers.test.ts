import { describe, expect, it } from "vitest";
import type { BillingSubscription } from "@my-ai-orchestrator/payments";
import {
  mapBillingSubscriptionFromRow,
  mapBillingSubscriptionToRow
} from "../src/infra/billing/billing-row-mappers.js";

describe("billing row mappers", () => {
  it("round-trips BillingSubscription row mapping with optional fields", () => {
    const subscription: BillingSubscription = {
      id: "sub-1",
      userId: "user-1",
      planId: "plan-pro",
      status: "active",
      startedAt: "2026-06-18T10:00:00.000Z",
      renewedAt: "2026-06-18T11:00:00.000Z",
      expiresAt: "2026-07-18T10:00:00.000Z"
    };

    const row = mapBillingSubscriptionToRow(subscription);
    expect(mapBillingSubscriptionFromRow(row)).toEqual(subscription);
  });

  it("round-trips BillingSubscription row mapping without optional fields", () => {
    const subscription: BillingSubscription = {
      id: "sub-2",
      userId: "user-2",
      planId: "plan-free",
      status: "active",
      startedAt: "2026-06-18T10:00:00.000Z"
    };

    const row = mapBillingSubscriptionToRow(subscription);
    expect(mapBillingSubscriptionFromRow(row)).toEqual(subscription);
  });
});
