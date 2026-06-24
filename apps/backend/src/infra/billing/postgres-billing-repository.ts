import { Effect } from "effect";
import type { Kysely, Transaction } from "kysely";
import {
  createBillingRepository,
  type BillingOperationResult,
  type BillingRepository
} from "@my-ai-orchestrator/payments";
import type { DatabaseTables } from "../postgres-tables.js";
import {
  mergeBillingUserSliceInto,
  replaceBillingRepositoryContents,
  type BillingUserSlice
} from "../billing-repository-sync.js";
import { runBillingRepositoryPersistSerialized } from "./billing-persist-queue.js";
import {
  mapBillingCycleStateFromRow,
  mapBillingCycleStateToRow,
  mapBillingIdempotencyToRow,
  mapBillingLedgerFromRow,
  mapBillingLedgerToRow,
  mapBillingPlanFromRow,
  mapBillingPlanToRow,
  mapBillingReservationFromRow,
  mapBillingReservationToRow,
  mapBillingSubscriptionFromRow,
  mapBillingSubscriptionToRow,
  mapBillingTopUpPackageFromRow,
  mapBillingTopUpPackageToRow,
  mapBillingUsageFromRow,
  mapBillingUsageToRow
} from "./billing-row-mappers.js";

export type BillingDbExecutor = Kysely<DatabaseTables> | Transaction<DatabaseTables>;

export function hasPostgresBillingTables(db: Kysely<DatabaseTables>): Effect.Effect<boolean, never> {
  return Effect.tryPromise({
    try: async () => {
      const tables = await db.introspection.getTables({ withInternalKyselyTables: false });
      return tables.some((table) => table.name === "billing_plans");
    },
    catch: () => false
  }).pipe(Effect.orElseSucceed(() => false));
}

export function loadPostgresBillingRepository(
  db: Kysely<DatabaseTables>
): Effect.Effect<BillingRepository, Error> {
  return Effect.tryPromise({
    try: async () => {
      const [plans, subscriptions, usage, ledger, reservations, cycleStates, topUpPackages, idempotency] =
        await Promise.all([
          db.selectFrom("billing_plans").selectAll().execute(),
          db.selectFrom("billing_subscriptions").selectAll().execute(),
          db.selectFrom("billing_usage_records").selectAll().execute(),
          db.selectFrom("billing_ledger_entries").selectAll().orderBy("id", "asc").execute(),
          db.selectFrom("billing_reservations").selectAll().execute(),
          db.selectFrom("billing_cycle_states").selectAll().execute(),
          db.selectFrom("billing_top_up_packages").selectAll().execute(),
          db.selectFrom("billing_operation_idempotency").selectAll().execute()
        ]);

      const repository = createBillingRepository({
        plans: plans.map((row) => mapBillingPlanFromRow(row)),
        subscriptions: subscriptions.map((row) => mapBillingSubscriptionFromRow(row)),
        usage: usage.map((row) => mapBillingUsageFromRow(row)),
        ledger: ledger.map((row) => mapBillingLedgerFromRow(row)),
        reservations: reservations.map((row) => mapBillingReservationFromRow(row)),
        cycleStates: cycleStates.map((row) => mapBillingCycleStateFromRow(row)),
        topUpPackages: topUpPackages.map((row) => mapBillingTopUpPackageFromRow(row))
      });

      for (const row of idempotency) {
        repository.idempotency.set(row.operation_key, row.result as BillingOperationResult<unknown>);
      }

      return repository;
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

async function clearBillingTables(trx: BillingDbExecutor): Promise<void> {
  await trx.deleteFrom("billing_operation_idempotency").execute();
  await trx.deleteFrom("billing_reservations").execute();
  await trx.deleteFrom("billing_ledger_entries").execute();
  await trx.deleteFrom("billing_usage_records").execute();
  await trx.deleteFrom("billing_cycle_states").execute();
  await trx.deleteFrom("billing_top_up_packages").execute();
  await trx.deleteFrom("billing_subscriptions").execute();
  await trx.deleteFrom("billing_plans").execute();
}

async function insertBillingRepository(
  trx: BillingDbExecutor,
  repository: BillingRepository
): Promise<void> {
  if (repository.plans.size > 0) {
    await trx
      .insertInto("billing_plans")
      .values(Array.from(repository.plans.entries()).map(([id, plan]) => mapBillingPlanToRow(id, plan)))
      .execute();
  }

  if (repository.subscriptions.size > 0) {
    await trx
      .insertInto("billing_subscriptions")
      .values(
        Array.from(repository.subscriptions.values()).map((subscription) =>
          mapBillingSubscriptionToRow(subscription)
        )
      )
      .execute();
  }

  if (repository.usage.length > 0) {
    await trx
      .insertInto("billing_usage_records")
      .values(repository.usage.map((entry) => mapBillingUsageToRow(entry)))
      .execute();
  }

  if (repository.ledger.length > 0) {
    await trx
      .insertInto("billing_ledger_entries")
      .values(repository.ledger.map((entry) => mapBillingLedgerToRow(entry)))
      .execute();
  }

  if (repository.reservations.size > 0) {
    await trx
      .insertInto("billing_reservations")
      .values(
        Array.from(repository.reservations.values()).map((reservation) =>
          mapBillingReservationToRow(reservation)
        )
      )
      .execute();
  }

  if (repository.cycleStates.size > 0) {
    await trx
      .insertInto("billing_cycle_states")
      .values(
        Array.from(repository.cycleStates.values()).map((state) => mapBillingCycleStateToRow(state))
      )
      .execute();
  }

  if (repository.topUpPackages.size > 0) {
    await trx
      .insertInto("billing_top_up_packages")
      .values(
        Array.from(repository.topUpPackages.values()).map((pkg) => mapBillingTopUpPackageToRow(pkg))
      )
      .execute();
  }

  if (repository.idempotency.size > 0) {
    await trx
      .insertInto("billing_operation_idempotency")
      .values(
        Array.from(repository.idempotency.entries()).map(([operationKey, result]) =>
          mapBillingIdempotencyToRow(operationKey, result)
        )
      )
      .execute();
  }
}

async function persistPostgresBillingRepositoryNow(
  executor: BillingDbExecutor,
  repository: BillingRepository
): Promise<void> {
  await clearBillingTables(executor);
  await insertBillingRepository(executor, repository);
}

export async function writePostgresBillingRepository(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository
): Promise<void> {
  await db.transaction().execute((trx) => persistPostgresBillingRepositoryNow(trx, repository));
}

export function savePostgresBillingRepository(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () =>
      runBillingRepositoryPersistSerialized(() => writePostgresBillingRepository(db, repository)),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function persistPostgresBillingRepositoryInTransaction(
  trx: BillingDbExecutor,
  repository: BillingRepository
): Promise<void> {
  return persistPostgresBillingRepositoryNow(trx, repository);
}

export function reloadPostgresBillingRepositoryInto(
  db: Kysely<DatabaseTables>,
  target: BillingRepository
): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    const loaded = yield* loadPostgresBillingRepository(db);
    replaceBillingRepositoryContents(target, loaded);
  });
}

export function loadPostgresBillingUserSlice(
  db: Kysely<DatabaseTables>,
  userId: string
): Effect.Effect<BillingUserSlice, Error> {
  return Effect.tryPromise({
    try: async () => {
      const accountPrefix = `${userId}:%`;

      const [subscriptions, usage, ledger, reservations, cycleStates] = await Promise.all([
        db.selectFrom("billing_subscriptions").selectAll().where("user_id", "=", userId).execute(),
        db.selectFrom("billing_usage_records").selectAll().where("user_id", "=", userId).execute(),
        db
          .selectFrom("billing_ledger_entries")
          .selectAll()
          .where("account_id", "like", accountPrefix)
          .orderBy("id", "asc")
          .execute(),
        db.selectFrom("billing_reservations").selectAll().where("account_id", "like", accountPrefix).execute(),
        db.selectFrom("billing_cycle_states").selectAll().where("account_id", "like", accountPrefix).execute()
      ]);

      const planIds = [...new Set(subscriptions.map((row) => row.plan_id))];
      const plans =
        planIds.length > 0
          ? await db.selectFrom("billing_plans").selectAll().where("id", "in", planIds).execute()
          : [];

      return {
        subscriptions: subscriptions.map((row) => mapBillingSubscriptionFromRow(row)),
        usage: usage.map((row) => mapBillingUsageFromRow(row)),
        ledger: ledger.map((row) => mapBillingLedgerFromRow(row)),
        reservations: reservations.map((row) => mapBillingReservationFromRow(row)),
        cycleStates: cycleStates.map((row) => mapBillingCycleStateFromRow(row)),
        plans: plans.map((row) => [row.id, mapBillingPlanFromRow(row)] as const)
      };
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function reloadPostgresBillingUserInto(
  db: Kysely<DatabaseTables>,
  target: BillingRepository,
  userId: string
): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    const slice = yield* loadPostgresBillingUserSlice(db, userId);
    mergeBillingUserSliceInto(target, userId, slice);
  });
}
