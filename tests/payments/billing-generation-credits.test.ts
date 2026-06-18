import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  captureReservedCredits,
  createBillingGenerationCreditsContext,
  releaseReservedCredits,
  reserveGenerationCredits
} from "../../packages/payments/src/billing-generation-credits.js";
import { createBillingRepository } from "../../packages/payments/src/repository.js";
import { appendLedgerEntry } from "../../packages/payments/src/ledger.js";
import { createAccountId } from "../../packages/payments/src/billing-utils.js";

describe("billing generation credits", () => {
  it("reserves, captures, and releases credits through the extracted module", () => {
    const fixedNow = new Date("2026-05-09T12:00:00.000Z");
    const repository = createBillingRepository({
      plans: [
        {
          id: "pro",
          tier: "pro",
          name: "Pro",
          monthlyCredits: 1000,
          features: [],
          allowedModels: []
        }
      ]
    });

    repository.subscriptions.set("sub_1", {
      id: "sub_1",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    appendLedgerEntry(repository, {
      subscriptionId: "sub_1",
      accountId: createAccountId("user_1", "pro"),
      entryType: "grant_cycle",
      creditsDelta: 1000,
      referenceType: "subscription_cycle",
      referenceId: "cycle_1",
      idempotencyKey: "cycle:1",
      createdAt: fixedNow.toISOString()
    });

    const ctx = createBillingGenerationCreditsContext({
      repository,
      clock: { now: () => fixedNow }
    });

    const reservation = Effect.runSync(
      reserveGenerationCredits(ctx)({
        userId: "user_1",
        planId: "pro",
        generationCycleId: "gen_1",
        qualityMode: "balanced",
        retryCount: 1,
        idempotencyKey: "reserve:gen_1",
        metadata: { jobId: "job_1" }
      })
    );

    expect(reservation.value.reservedCredits).toBe(3.3);
    expect(reservation.value.status).toBe("reserved");

    const captured = Effect.runSync(
      captureReservedCredits(ctx)({
        reservationId: reservation.value.reservationId,
        idempotencyKey: "capture:gen_1"
      })
    );
    expect(captured.value.status).toBe("captured");

    const secondReservation = Effect.runSync(
      reserveGenerationCredits(ctx)({
        userId: "user_1",
        planId: "pro",
        generationCycleId: "gen_2",
        qualityMode: "strict",
        retryCount: 0,
        idempotencyKey: "reserve:gen_2"
      })
    );

    const released = Effect.runSync(
      releaseReservedCredits(ctx)({
        reservationId: secondReservation.value.reservationId,
        idempotencyKey: "release:gen_2",
        metadata: { reason: "quality_gate_failed" }
      })
    );
    expect(released.value.status).toBe("released");

    expect(repository.ledger.map((entry) => entry.entryType)).toEqual([
      "grant_cycle",
      "reserve",
      "capture",
      "reserve",
      "release"
    ]);
    expect(repository.usage).toHaveLength(1);
  });

  it("keeps reserve idempotent under repeated execution", async () => {
    const repository = createBillingRepository({
      plans: [
        {
          id: "starter",
          tier: "starter",
          name: "Starter",
          monthlyCredits: 50,
          features: [],
          allowedModels: []
        }
      ]
    });

    repository.subscriptions.set("sub_1", {
      id: "sub_1",
      userId: "user_1",
      planId: "starter",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    appendLedgerEntry(repository, {
      subscriptionId: "sub_1",
      accountId: createAccountId("user_1", "starter"),
      entryType: "grant_cycle",
      creditsDelta: 50,
      referenceType: "subscription_cycle",
      referenceId: "cycle_starter",
      idempotencyKey: "cycle:starter",
      createdAt: "2026-05-09T00:00:00.000Z"
    });

    const ctx = createBillingGenerationCreditsContext({ repository });
    const request = {
      userId: "user_1",
      planId: "starter",
      generationCycleId: "gen_same",
      qualityMode: "fast" as const,
      retryCount: 0,
      idempotencyKey: "reserve:same"
    };

    const [firstReserve, secondReserve] = await Effect.runPromise(
      Effect.all([reserveGenerationCredits(ctx)(request), reserveGenerationCredits(ctx)(request)])
    );

    expect(firstReserve.value.reservationId).toBe(secondReserve.value.reservationId);
    expect(repository.ledger.filter((entry) => entry.entryType === "reserve")).toHaveLength(1);
  });
});
