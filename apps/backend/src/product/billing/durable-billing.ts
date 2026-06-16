import { Effect } from "effect";
import type { Kysely } from "kysely";
import {
  createBillingService,
  type BillingRepository,
  type BillingServiceContract
} from "@my-ai-orchestrator/payments";
import type { DatabaseTables } from "../../infra/postgres-tables.js";
import { saveBillingRepository } from "../../infra/durable-store.js";

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
  const persist = () => saveBillingRepository(postgres, repository, now().toISOString());

  const schedulePersist = () => {
    void Effect.runPromise(persist()).catch(logPersistFailure);
  };

  return {
    registerPlan(plan) {
      return billing.registerPlan(plan).pipe(Effect.tap(() => persist()));
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
      return billing.consumeCredits(userId, planId, amount, kind).pipe(Effect.tap(() => persist()));
    },
    quoteDebitForMode: billing.quoteDebitForMode.bind(billing),
    startCycle(request) {
      return billing.startCycle(request).pipe(Effect.tap(() => persist()));
    },
    reserveGenerationCredits(request) {
      return billing.reserveGenerationCredits(request).pipe(Effect.tap(() => persist()));
    },
    captureReservedCredits(request) {
      return billing.captureReservedCredits(request).pipe(Effect.tap(() => persist()));
    },
    releaseReservedCredits(request) {
      return billing.releaseReservedCredits(request).pipe(Effect.tap(() => persist()));
    },
    registerTopUpPackage(pkg) {
      const result = billing.registerTopUpPackage(pkg);
      schedulePersist();
      return result;
    },
    listTopUpPackages: billing.listTopUpPackages.bind(billing),
    purchaseTopUp(request) {
      return billing.purchaseTopUp(request).pipe(Effect.tap(() => persist()));
    },
    charge: billing.charge.bind(billing),
    listPlans: billing.listPlans.bind(billing),
    getPrimarySubscriptionPlanId: billing.getPrimarySubscriptionPlanId.bind(billing),
    listUsage: billing.listUsage.bind(billing),
    listLedger: billing.listLedger.bind(billing),
    listReservations: billing.listReservations.bind(billing)
  };
}
