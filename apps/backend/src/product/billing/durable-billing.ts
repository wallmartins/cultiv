import { Effect } from "effect";
import type { Kysely } from "kysely";
import {
  createBillingService,
  type BillingRepository,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import type { DatabaseTables } from "../../infra/postgres-tables.js";
import {
  persistPostgresBillingUserSliceInTransaction,
  scheduleBillingRepositoryPersist,
  upsertPostgresBillingPlans,
  upsertPostgresBillingTopUpPackages
} from "../../infra/postgres-billing-store.js";

function logPersistFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[billing] failed to persist repository: ${message}`);
}

export function createPersistingBillingService(
  postgres: Kysely<DatabaseTables>,
  repository: BillingRepository,
  _now: () => Date
): BillingServiceContract {
  const billing = createBillingService({ repository });

  const schedulePlansPersist = (): void => {
    scheduleBillingRepositoryPersist(() =>
      upsertPostgresBillingPlans(postgres, repository).catch((error) => {
        logPersistFailure(error);
      })
    );
  };

  const scheduleTopUpPackagesPersist = (): void => {
    scheduleBillingRepositoryPersist(() =>
      upsertPostgresBillingTopUpPackages(postgres, repository).catch((error) => {
        logPersistFailure(error);
      })
    );
  };

  const scheduleUserPersist = (userId: string): void => {
    scheduleBillingRepositoryPersist(() =>
      persistPostgresBillingUserSliceInTransaction(postgres, repository, userId).catch((error) => {
        logPersistFailure(error);
      })
    );
  };

  const scheduleReservationPersist = (reservationId: string): void => {
    const reservation = repository.reservations.get(reservationId);
    if (!reservation) {
      return;
    }

    scheduleUserPersist(reservation.accountId.split(":")[0] ?? reservation.accountId);
  };

  return {
    registerPlan(plan) {
      return billing.registerPlan(plan).pipe(Effect.tap(() => Effect.sync(() => schedulePlansPersist())));
    },
    upsertSubscription(subscription) {
      const result = billing.upsertSubscription(subscription);
      scheduleUserPersist(subscription.userId);
      return result;
    },
    recordUsage(usage) {
      const result = billing.recordUsage(usage);
      scheduleUserPersist(usage.userId);
      return result;
    },
    getEntitlement: billing.getEntitlement.bind(billing),
    getWallet: billing.getWallet.bind(billing),
    consumeCredits(userId, planId, amount, kind) {
      return billing
        .consumeCredits(userId, planId, amount, kind)
        .pipe(Effect.tap(() => Effect.sync(() => scheduleUserPersist(userId))));
    },
    quoteDebitForMode: billing.quoteDebitForMode.bind(billing),
    startCycle(request) {
      return billing
        .startCycle(request)
        .pipe(Effect.tap(() => Effect.sync(() => scheduleUserPersist(request.userId))));
    },
    reserveGenerationCredits(request) {
      return billing
        .reserveGenerationCredits(request)
        .pipe(Effect.tap(() => Effect.sync(() => scheduleUserPersist(request.userId))));
    },
    captureReservedCredits(request) {
      return billing
        .captureReservedCredits(request)
        .pipe(Effect.tap(() => Effect.sync(() => scheduleReservationPersist(request.reservationId))));
    },
    releaseReservedCredits(request) {
      return billing
        .releaseReservedCredits(request)
        .pipe(Effect.tap(() => Effect.sync(() => scheduleReservationPersist(request.reservationId))));
    },
    registerTopUpPackage(pkg) {
      const result = billing.registerTopUpPackage(pkg);
      scheduleTopUpPackagesPersist();
      return result;
    },
    listTopUpPackages: billing.listTopUpPackages.bind(billing),
    purchaseTopUp(request) {
      return billing
        .purchaseTopUp(request)
        .pipe(Effect.tap(() => Effect.sync(() => scheduleUserPersist(request.userId))));
    },
    charge: billing.charge.bind(billing),
    listPlans: billing.listPlans.bind(billing),
    getPrimarySubscriptionPlanId: billing.getPrimarySubscriptionPlanId.bind(billing),
    listUsage: billing.listUsage.bind(billing),
    listLedger: billing.listLedger.bind(billing),
    listReservations: billing.listReservations.bind(billing)
  };
}
