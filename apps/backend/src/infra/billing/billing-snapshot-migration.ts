import { Effect } from "effect";
import type {
  BillingCycleState,
  BillingGenerationReservation,
  BillingLedgerEntry,
  BillingTopUpPackage
} from "@my-ai-orchestrator/contracts";
import {
  createBillingRepository,
  type BillingOperationResult,
  type BillingPlanDefinition,
  type BillingSubscription,
  type BillingUsageRecord
} from "@my-ai-orchestrator/payments";
import {
  persistPostgresBillingRepositoryInTransaction,
  type BillingDbExecutor
} from "./postgres-billing-repository.js";

const BILLING_SNAPSHOT_ID = "default";

interface BillingSnapshotPayload {
  readonly plans?: ReadonlyArray<[string, unknown]>;
  readonly subscriptions?: ReadonlyArray<[string, unknown]>;
  readonly usage?: unknown[];
  readonly ledger?: unknown[];
  readonly topUpPackages?: ReadonlyArray<[string, unknown]>;
  readonly reservations?: ReadonlyArray<[string, unknown]>;
  readonly cycleStates?: ReadonlyArray<[string, unknown]>;
  readonly idempotency?: ReadonlyArray<[string, unknown]>;
}

export function backfillBillingSnapshotIntoRelationalTables(
  db: BillingDbExecutor
): Effect.Effect<boolean, Error> {
  return Effect.gen(function* () {
    const snapshotRow = yield* Effect.tryPromise({
      try: () =>
        db
          .selectFrom("billing_snapshots")
          .where("id", "=", BILLING_SNAPSHOT_ID)
          .selectAll()
          .executeTakeFirst(),
      catch: (error) => (error instanceof Error ? error : new Error(String(error)))
    });

    if (!snapshotRow) {
      return false;
    }

    const existingPlans = yield* Effect.tryPromise({
      try: () => db.selectFrom("billing_plans").select("id").limit(1).execute(),
      catch: (error) => (error instanceof Error ? error : new Error(String(error)))
    });

    if (existingPlans.length > 0) {
      return false;
    }

    const payload = snapshotRow.data as BillingSnapshotPayload;
    const repository = createBillingRepository({
      plans: (payload.plans?.map(([, plan]) => plan) ?? []) as BillingPlanDefinition[],
      subscriptions: (payload.subscriptions?.map(([, subscription]) => subscription) ?? []) as BillingSubscription[],
      usage: (payload.usage ?? []) as BillingUsageRecord[],
      ledger: (payload.ledger ?? []) as BillingLedgerEntry[],
      topUpPackages: (payload.topUpPackages?.map(([, pkg]) => pkg) ?? []) as BillingTopUpPackage[],
      reservations: (payload.reservations?.map(([, reservation]) => reservation) ?? []) as BillingGenerationReservation[],
      cycleStates: (payload.cycleStates?.map(([, state]) => state) ?? []) as BillingCycleState[]
    });

    for (const [key, value] of payload.idempotency ?? []) {
      repository.idempotency.set(key, value as BillingOperationResult<unknown>);
    }

    yield* Effect.tryPromise({
      try: () => persistPostgresBillingRepositoryInTransaction(db, repository),
      catch: (error) => (error instanceof Error ? error : new Error(String(error)))
    });
    return true;
  });
}
