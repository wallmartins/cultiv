import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  BillingPlanInvalidError,
  BillingReservationNotFoundError,
  BillingService,
  BillingTopUpPackageNotFoundError,
  calculateDebitForMode,
  calculateRolloverCredits,
  createBillingEntitlement,
  createBillingRepository,
  createBillingService,
  createBillingServiceLayer,
  createManualGateway,
  defineBillingPlan,
  listBillingFeatures,
  resolveDefaultPlanId,
  withBilling
} from "../../packages/payments/src/index.js";
import { createAsaasGateway, createStripeGateway } from "./stub-gateways.js";

describe("payments package", () => {
  it("defines billing plans and derives entitlements", () => {
    const plan = Effect.runSync(
      defineBillingPlan({
        id: "pro",
        tier: "pro",
        name: "Pro",
        monthlyCredits: 1000,
        dailyCredits: 100,
        features: [
          { key: "execution.sync_mode", enabled: true },
          { key: "content.language.refinement", enabled: true }
        ],
        allowedModels: ["gpt-4o-mini"]
      })
    );

    const entitlement = createBillingEntitlement(plan, {
      id: "sub_1",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    expect(entitlement.canGenerate).toBe(true);
    expect(entitlement.canRefine).toBe(true);
    expect(entitlement.wallet.availableCredits).toBe(1000);
    expect(listBillingFeatures(entitlement)).toEqual(["execution.sync_mode", "content.language.refinement"]);
  });

  it("quotes debit per quality mode with retry surcharge", () => {
    expect(calculateDebitForMode("fast", 0)).toBe(1);
    expect(calculateDebitForMode("balanced", 1)).toBe(3.3);
    expect(calculateDebitForMode("strict", 2)).toBe(13);
  });

  it("tracks subscriptions, reserve/capture/release and top-up through an append-only ledger", async () => {
    const fixedNow = new Date("2026-05-09T12:00:00.000Z");
    const service = createBillingService({
      gateway: createStripeGateway(),
      clock: {
        now: () => fixedNow
      },
      repository: createBillingRepository({
        plans: [
          {
            id: "pro",
            tier: "pro",
            name: "Pro",
            monthlyCredits: 1000,
            dailyCredits: 200,
            features: [{ key: "content.language.refinement", enabled: true }],
            allowedModels: ["gpt-4o-mini"]
          }
        ]
      })
    });

    service.upsertSubscription({
      id: "sub_1",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    service.registerTopUpPackage({
      id: "topup_100",
      credits: 100,
      priceCents: 4900,
      currency: "BRL",
      description: "100 credits"
    });

    const startedCycle = Effect.runSync(
      service.startCycle({
        userId: "user_1",
        planId: "pro",
        cycleId: "cycle_2026_05",
        idempotencyKey: "cycle:2026_05"
      })
    );
    expect(startedCycle.value.grantedCredits).toBe(1000);

    const reservation = Effect.runSync(
      service.reserveGenerationCredits({
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
    expect(service.getWallet("user_1", "pro")?.availableCredits).toBe(996.7);
    expect(service.getWallet("user_1", "pro")?.reservedCredits).toBe(3.3);

    const captured = Effect.runSync(
      service.captureReservedCredits({
        reservationId: reservation.value.reservationId,
        idempotencyKey: "capture:gen_1"
      })
    );
    expect(captured.value.status).toBe("captured");
    expect(service.getWallet("user_1", "pro")?.reservedCredits).toBe(0);

    const releasedReservation = Effect.runSync(
      service.reserveGenerationCredits({
        userId: "user_1",
        planId: "pro",
        generationCycleId: "gen_2",
        qualityMode: "strict",
        retryCount: 0,
        idempotencyKey: "reserve:gen_2"
      })
    );
    expect(releasedReservation.value.reservedCredits).toBe(10);

    const released = Effect.runSync(
      service.releaseReservedCredits({
        reservationId: releasedReservation.value.reservationId,
        idempotencyKey: "release:gen_2",
        metadata: { reason: "quality_gate_failed" }
      })
    );
    expect(released.value.status).toBe("released");
    expect(service.getWallet("user_1", "pro")?.availableCredits).toBe(996.7);

    const topUp = await Effect.runPromise(
      service.purchaseTopUp({
        userId: "user_1",
        planId: "pro",
        packageId: "topup_100",
        idempotencyKey: "topup:1",
        chargeRequest: {
          userId: "user_1",
          subscriptionId: "sub_1",
          amount: 4900,
          currency: "BRL"
        }
      })
    );

    expect(topUp.value.charge.status).toBe("paid");
    expect(topUp.value.wallet?.availableCredits).toBe(1096.7);

    const ledger = service.listLedger("user_1", "pro");
    expect(ledger.map((entry) => entry.entryType)).toEqual([
      "grant_cycle",
      "reserve",
      "capture",
      "reserve",
      "release",
      "grant_topup"
    ]);
    expect(service.listUsage("user_1")).toHaveLength(1);
  });

  it("applies rollover with cap when a new cycle starts", () => {
    const service = createBillingService({
      repository: createBillingRepository({
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
      }),
      clock: {
        now: () => new Date("2026-06-01T00:00:00.000Z")
      }
    });

    service.upsertSubscription({
      id: "sub_1",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: "2026-05-01T00:00:00.000Z"
    });

    Effect.runSync(
      service.startCycle({
        userId: "user_1",
        planId: "pro",
        cycleId: "cycle_may",
        idempotencyKey: "cycle:may"
      })
    );
    Effect.runSync(service.consumeCredits("user_1", "pro", 600, "generation"));

    const rollover = calculateRolloverCredits(400);
    expect(rollover).toBe(100);

    const nextCycle = Effect.runSync(
      service.startCycle({
        userId: "user_1",
        planId: "pro",
        cycleId: "cycle_june",
        idempotencyKey: "cycle:june"
      })
    );

    expect(nextCycle.value.rolloverCredits).toBe(100);
    expect(nextCycle.value.expiredCredits).toBe(400);
    expect(service.getWallet("user_1", "pro")?.availableCredits).toBe(1100);
    expect(service.listLedger("user_1", "pro").map((entry) => entry.entryType)).toEqual([
      "grant_cycle",
      "capture",
      "expire",
      "grant_rollover",
      "grant_cycle"
    ]);
  });

  it("keeps reserve and top-up idempotent under repeated and concurrent execution", async () => {
    const service = createBillingService({
      gateway: createStripeGateway(),
      repository: createBillingRepository({
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
      })
    });

    service.upsertSubscription({
      id: "sub_1",
      userId: "user_1",
      planId: "starter",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });
    service.registerTopUpPackage({
      id: "topup_25",
      credits: 25,
      priceCents: 1200,
      currency: "BRL"
    });

    Effect.runSync(
      service.startCycle({
        userId: "user_1",
        planId: "starter",
        cycleId: "cycle_starter",
        idempotencyKey: "cycle:starter"
      })
    );

    const reserveRequest = {
      userId: "user_1",
      planId: "starter",
      generationCycleId: "gen_same",
      qualityMode: "fast" as const,
      retryCount: 0,
      idempotencyKey: "reserve:same"
    };

    const [firstReserve, secondReserve] = await Effect.runPromise(
      Effect.all([
        service.reserveGenerationCredits(reserveRequest),
        service.reserveGenerationCredits(reserveRequest)
      ])
    );
    expect(firstReserve.value.reservationId).toBe(secondReserve.value.reservationId);
    expect(service.listLedger("user_1", "starter").filter((entry) => entry.entryType === "reserve")).toHaveLength(1);

    const [firstTopUp, secondTopUp] = await Effect.runPromise(
      Effect.all([
        service.purchaseTopUp({
          userId: "user_1",
          planId: "starter",
          packageId: "topup_25",
          idempotencyKey: "topup:same",
          chargeRequest: {
            userId: "user_1",
            subscriptionId: "sub_1",
            amount: 1200,
            currency: "BRL"
          }
        }),
        service.purchaseTopUp({
          userId: "user_1",
          planId: "starter",
          packageId: "topup_25",
          idempotencyKey: "topup:same",
          chargeRequest: {
            userId: "user_1",
            subscriptionId: "sub_1",
            amount: 1200,
            currency: "BRL"
          }
        })
      ])
    );

    expect(firstTopUp.value.charge.transactionId).toBe(secondTopUp.value.charge.transactionId);
    expect(service.listLedger("user_1", "starter").filter((entry) => entry.entryType === "grant_topup")).toHaveLength(1);
  });

  it("provides the billing service through Effect layers", () => {
    const result = Effect.runSync(
      Effect.gen(function* () {
        const billing = yield* BillingService;
        return {
          defaultPlan: resolveDefaultPlanId(createBillingRepository()),
          planCount: billing.listPlans().length,
          manualGateway: createManualGateway().name,
          asaasGateway: createAsaasGateway().name
        };
      }).pipe(Effect.provide(createBillingServiceLayer()))
    );

    expect(result.defaultPlan).toBe("trial");
    expect(result.planCount).toBeGreaterThan(0);
    expect(result.manualGateway).toBe("manual");
    expect(result.asaasGateway).toBe("asaas");
  });

  it("supports WithBilling helper", () => {
    const result = Effect.runSync(
      withBilling(
        Effect.gen(function* () {
          const billing = yield* BillingService;
          return billing.listPlans().map((plan) => plan.id);
        }),
        {
          repository: createBillingRepository()
        }
      )
    );

    expect(result).toContain("trial");
    expect(result).toContain("criador");
  });

  it("fails with typed errors for invalid plan, missing top-up package and missing reservation", async () => {
    const invalidPlan = Effect.runSync(
      Effect.either(
        defineBillingPlan({
          id: "bad",
          tier: "pro",
          name: "Bad",
          monthlyCredits: -1,
          features: []
        })
      )
    );
    expect(invalidPlan._tag).toBe("Left");
    expect(invalidPlan.left).toBeInstanceOf(BillingPlanInvalidError);

    const service = createBillingService({
      gateway: createStripeGateway(),
      repository: createBillingRepository({
        plans: [
          {
            id: "pro",
            tier: "pro",
            name: "Pro",
            monthlyCredits: 10,
            features: [],
            allowedModels: []
          }
        ]
      })
    });
    service.upsertSubscription({
      id: "sub_1",
      userId: "user_1",
      planId: "pro",
      status: "active",
      startedAt: "2026-05-09T00:00:00.000Z"
    });

    const missingTopUp = await Effect.runPromise(
      Effect.either(
        service.purchaseTopUp({
          userId: "user_1",
          planId: "pro",
          packageId: "missing",
          idempotencyKey: "topup:missing",
          chargeRequest: {
            userId: "user_1",
            subscriptionId: "sub_1",
            amount: 1000,
            currency: "BRL"
          }
        })
      )
    );
    expect(missingTopUp._tag).toBe("Left");
    expect(missingTopUp.left).toBeInstanceOf(BillingTopUpPackageNotFoundError);

    const missingReservation = await Effect.runPromise(
      Effect.either(
        service.releaseReservedCredits({
          reservationId: "missing:reservation",
          idempotencyKey: "release:missing"
        })
      )
    );
    expect(missingReservation._tag).toBe("Left");
    expect(missingReservation.left).toBeInstanceOf(BillingReservationNotFoundError);
  });
});
