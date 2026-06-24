import { describe, expect, it } from "vitest";
import { createBillingRepository } from "@my-ai-orchestrator/payments";
import { mergeBillingUserSliceInto } from "../src/infra/billing-repository-sync.js";

describe("mergeBillingUserSliceInto", () => {
  it("replaces only the targeted user's billing slice in the repository", () => {
    const repository = createBillingRepository();

    repository.subscriptions.set("user-a:pro:subscription", {
      id: "user-a:pro:subscription",
      userId: "user-a",
      planId: "pro",
      status: "active",
      startedAt: "2026-06-14T10:00:00.000Z"
    });
    repository.subscriptions.set("user-b:pro:subscription", {
      id: "user-b:pro:subscription",
      userId: "user-b",
      planId: "pro",
      status: "active",
      startedAt: "2026-06-14T10:00:00.000Z"
    });

    repository.reservations.set("user-a:cycle:reservation", {
      reservationId: "user-a:cycle:reservation",
      generationCycleId: "user-a:cycle",
      subscriptionId: "user-a:pro:subscription",
      accountId: "user-a:pro",
      qualityMode: "balanced",
      retryCount: 0,
      reservedCredits: 1,
      status: "reserved",
      idempotencyKey: "reserve-a",
      metadata: {},
      createdAt: "2026-06-14T10:00:00.000Z",
      updatedAt: "2026-06-14T10:00:00.000Z"
    });
    repository.reservations.set("user-b:cycle:reservation", {
      reservationId: "user-b:cycle:reservation",
      generationCycleId: "user-b:cycle",
      subscriptionId: "user-b:pro:subscription",
      accountId: "user-b:pro",
      qualityMode: "balanced",
      retryCount: 0,
      reservedCredits: 1,
      status: "reserved",
      idempotencyKey: "reserve-b",
      metadata: {},
      createdAt: "2026-06-14T10:00:00.000Z",
      updatedAt: "2026-06-14T10:00:00.000Z"
    });

    mergeBillingUserSliceInto(repository, "user-a", {
      subscriptions: [
        {
          id: "user-a:pro:subscription",
          userId: "user-a",
          planId: "pro",
          status: "active",
          startedAt: "2026-06-14T11:00:00.000Z"
        }
      ],
      usage: [],
      ledger: [],
      reservations: [
        {
          reservationId: "user-a:cycle:reservation",
          generationCycleId: "user-a:cycle",
          subscriptionId: "user-a:pro:subscription",
          accountId: "user-a:pro",
          qualityMode: "balanced",
          retryCount: 0,
          reservedCredits: 2,
          status: "reserved",
          idempotencyKey: "reserve-a",
          metadata: {},
          createdAt: "2026-06-14T11:00:00.000Z",
          updatedAt: "2026-06-14T11:00:00.000Z"
        }
      ],
      cycleStates: [],
      plans: []
    });

    expect(repository.subscriptions.get("user-a:pro:subscription")?.startedAt).toBe("2026-06-14T11:00:00.000Z");
    expect(repository.reservations.get("user-a:cycle:reservation")?.reservedCredits).toBe(2);
    expect(repository.subscriptions.has("user-b:pro:subscription")).toBe(true);
    expect(repository.reservations.get("user-b:cycle:reservation")?.reservedCredits).toBe(1);
  });
});
