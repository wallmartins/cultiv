import { Effect } from "effect";
import type { Kysely } from "kysely";
import {
  createBillingService,
  type BillingRepository,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import type { DatabaseTables } from "../../infra/postgres-tables.js";
import { saveBillingRepository, saveBillingRepositoryUnqueued } from "../../infra/durable-store.js";
import { scheduleBillingRepositoryPersist } from "../../infra/postgres-billing-store.js";

function logPersistFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[billing] failed to persist repository: ${message}`);
}

export function createPersistingBillingService(
  postgres: Kysely<DatabaseTables>,
  repository: BillingRepository,
  now: () => Date
): BillingServiceContract {
  const billing = createBillingService({ repository });
  const persistUnqueued = () => saveBillingRepositoryUnqueued(postgres, repository, now().toISOString());
  const persist = () => saveBillingRepository(postgres, repository, now().toISOString());
  const persistSilently = () =>
    persist().pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          logPersistFailure(error);
        })
      )
    );

  const schedulePersist = (): void => {
    scheduleBillingRepositoryPersist(() => Effect.runPromise(persistUnqueued()));
  };

  return {
    registerPlan(plan) {
      return billing.registerPlan(plan).pipe(Effect.tap(() => persistSilently()));
    },
    upsertSubscription(subscription) {
      const result = billing.upsertSubscription(subscription);
      schedulePersist();
      return result;
    },
    recordUsage(usage) {
      const result = billing.recordUsage(usage);
      schedulePersist();
      return result;
    },
    getEntitlement: billing.getEntitlement.bind(billing),
    getWallet: billing.getWallet.bind(billing),
    consumeCredits(userId, planId, amount, kind) {
      return billing.consumeCredits(userId, planId, amount, kind).pipe(Effect.tap(() => persistSilently()));
    },
    quoteDebitForMode: billing.quoteDebitForMode.bind(billing),
    startCycle(request) {
      return billing.startCycle(request).pipe(Effect.tap(() => persistSilently()));
    },
    reserveGenerationCredits(request) {
      return billing.reserveGenerationCredits(request).pipe(Effect.tap(() => persistSilently()));
    },
    captureReservedCredits(request) {
      return billing.captureReservedCredits(request).pipe(Effect.tap(() => persistSilently()));
    },
    releaseReservedCredits(request) {
      return billing.releaseReservedCredits(request).pipe(Effect.tap(() => persistSilently()));
    },
    registerTopUpPackage(pkg) {
      const result = billing.registerTopUpPackage(pkg);
      schedulePersist();
      return result;
    },
    listTopUpPackages: billing.listTopUpPackages.bind(billing),
    purchaseTopUp(request) {
      return billing.purchaseTopUp(request).pipe(Effect.tap(() => persistSilently()));
    },
    charge: billing.charge.bind(billing),
    listPlans: billing.listPlans.bind(billing),
    getPrimarySubscriptionPlanId: billing.getPrimarySubscriptionPlanId.bind(billing),
    listUsage: billing.listUsage.bind(billing),
    listLedger: billing.listLedger.bind(billing),
    listReservations: billing.listReservations.bind(billing)
  };
}
