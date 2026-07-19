import { Effect } from "effect";
import type { Kysely, Transaction } from "kysely";
import {
  createBillingRepository,
  type BillingOperationResult,
  type BillingRepository,
  type BillingSubscription,
  type BillingUsageRecord
} from "@my-ai-orchestrator/payments";
import type {
  BillingCycleState,
  BillingGenerationReservation,
  BillingLedgerEntry
} from "@my-ai-orchestrator/contracts";
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

export class BillingDestructivePersistBlockedError extends Error {
  constructor() {
    super(
      "Blocked full billing table replace: PostgreSQL is the source of truth; use scoped upsert persistence instead"
    );
    this.name = "BillingDestructivePersistBlockedError";
  }
}

export function hasPostgresBillingTables(db: Kysely<DatabaseTables>): Effect.Effect<boolean, never> {
  return Effect.tryPromise({
    try: async () => {
      const tables = await db.introspection.getTables({ withInternalKyselyTables: false });
      return tables.some((table) => table.name === "billing_plans");
    },
    catch: () => false
  }).pipe(Effect.orElseSucceed(() => false));
}

export function loadPostgresBillingCatalog(
  db: Kysely<DatabaseTables>
): Effect.Effect<BillingRepository, Error> {
  return Effect.tryPromise({
    try: async () => {
      const [plans, topUpPackages] = await Promise.all([
        db.selectFrom("billing_plans").selectAll().execute(),
        db.selectFrom("billing_top_up_packages").selectAll().execute()
      ]);

      return createBillingRepository({
        plans: plans.map((row) => mapBillingPlanFromRow(row)),
        topUpPackages: topUpPackages.map((row) => mapBillingTopUpPackageFromRow(row))
      });
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
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
  repository: BillingRepository,
  options: { readonly allowDestructiveReplace?: boolean } = {}
): Promise<void> {
  if (!options.allowDestructiveReplace) {
    throw new BillingDestructivePersistBlockedError();
  }

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
  repository: BillingRepository,
  options: { readonly allowDestructiveReplace?: boolean } = {}
): Promise<void> {
  if (!options.allowDestructiveReplace) {
    return Promise.reject(new BillingDestructivePersistBlockedError());
  }

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

function userAccountPrefix(userId: string): string {
  return `${userId}:`;
}

export async function upsertPostgresBillingPlans(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository
): Promise<void> {
  for (const [id, plan] of repository.plans) {
    const row = mapBillingPlanToRow(id, plan);
    await db
      .insertInto("billing_plans")
      .values(row)
      .onConflict((oc) => oc.column("id").doUpdateSet({ data: row.data }))
      .execute();
  }
}

export async function upsertPostgresBillingTopUpPackages(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository
): Promise<void> {
  for (const pkg of repository.topUpPackages.values()) {
    const row = mapBillingTopUpPackageToRow(pkg);
    await db
      .insertInto("billing_top_up_packages")
      .values(row)
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          credits: row.credits,
          price_cents: row.price_cents,
          currency: row.currency,
          description: row.description
        })
      )
      .execute();
  }
}

async function upsertBillingSubscriptionRow(
  executor: BillingDbExecutor,
  subscription: BillingSubscription
): Promise<void> {
  const row = mapBillingSubscriptionToRow(subscription);
  await executor
    .insertInto("billing_subscriptions")
    .values(row)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet({
        user_id: row.user_id,
        plan_id: row.plan_id,
        status: row.status,
        started_at: row.started_at,
        renewed_at: row.renewed_at,
        expires_at: row.expires_at
      })
    )
    .execute();
}

async function upsertBillingUsageRow(executor: BillingDbExecutor, entry: BillingUsageRecord): Promise<void> {
  const row = mapBillingUsageToRow(entry);
  await executor
    .insertInto("billing_usage_records")
    .values(row)
    .onConflict((oc) =>
      oc.column("id").doUpdateSet({
        user_id: row.user_id,
        plan_id: row.plan_id,
        subscription_id: row.subscription_id,
        kind: row.kind,
        amount: row.amount,
        credits: row.credits,
        created_at: row.created_at,
        metadata: row.metadata
      })
    )
    .execute();
}

async function upsertBillingLedgerRow(executor: BillingDbExecutor, entry: BillingLedgerEntry): Promise<void> {
  const row = mapBillingLedgerToRow(entry);
  await executor
    .insertInto("billing_ledger_entries")
    .values(row)
    .onConflict((oc) => oc.column("idempotency_key").doNothing())
    .execute();
}

async function upsertBillingReservationRow(
  executor: BillingDbExecutor,
  reservation: BillingGenerationReservation
): Promise<void> {
  const row = mapBillingReservationToRow(reservation);
  await executor
    .insertInto("billing_reservations")
    .values(row)
    .onConflict((oc) =>
      oc.column("reservation_id").doUpdateSet({
        generation_cycle_id: row.generation_cycle_id,
        subscription_id: row.subscription_id,
        account_id: row.account_id,
        quality_mode: row.quality_mode,
        retry_count: row.retry_count,
        reserved_credits: row.reserved_credits,
        status: row.status,
        idempotency_key: row.idempotency_key,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      })
    )
    .execute();
}

async function upsertBillingCycleStateRow(executor: BillingDbExecutor, state: BillingCycleState): Promise<void> {
  const row = mapBillingCycleStateToRow(state);
  await executor
    .insertInto("billing_cycle_states")
    .values(row)
    .onConflict((oc) =>
      oc.column("account_id").doUpdateSet({
        cycle_id: row.cycle_id,
        subscription_id: row.subscription_id,
        opened_at: row.opened_at,
        closed_at: row.closed_at,
        rollover_credits: row.rollover_credits,
        granted_credits: row.granted_credits,
        expired_credits: row.expired_credits
      })
    )
    .execute();
}

async function upsertBillingIdempotencyRow(
  executor: BillingDbExecutor,
  operationKey: string,
  result: BillingOperationResult<unknown>
): Promise<void> {
  const row = mapBillingIdempotencyToRow(operationKey, result);
  await executor
    .insertInto("billing_operation_idempotency")
    .values(row)
    .onConflict((oc) => oc.column("operation_key").doUpdateSet({ result: row.result }))
    .execute();
}

export async function persistPostgresBillingUserSlice(
  executor: BillingDbExecutor,
  repository: BillingRepository,
  userId: string
): Promise<void> {
  const accountPrefix = userAccountPrefix(userId);
  const subscriptions = Array.from(repository.subscriptions.values()).filter(
    (subscription) => subscription.userId === userId
  );
  const usage = repository.usage.filter((entry) => entry.userId === userId);
  const ledger = repository.ledger.filter((entry) => entry.accountId.startsWith(accountPrefix));
  const reservations = Array.from(repository.reservations.values()).filter((reservation) =>
    reservation.accountId.startsWith(accountPrefix)
  );
  const cycleStates = Array.from(repository.cycleStates.values()).filter((state) =>
    state.accountId.startsWith(accountPrefix)
  );
  const idempotency = Array.from(repository.idempotency.entries()).filter(([operationKey]) =>
    operationKey.includes(userId)
  );

  for (const subscription of subscriptions) {
    await upsertBillingSubscriptionRow(executor, subscription);
  }

  for (const entry of usage) {
    await upsertBillingUsageRow(executor, entry);
  }

  for (const entry of ledger) {
    await upsertBillingLedgerRow(executor, entry);
  }

  for (const reservation of reservations) {
    await upsertBillingReservationRow(executor, reservation);
  }

  for (const state of cycleStates) {
    await upsertBillingCycleStateRow(executor, state);
  }

  const planIds = [...new Set(subscriptions.map((subscription) => subscription.planId))];
  for (const planId of planIds) {
    const plan = repository.plans.get(planId);
    if (!plan) {
      continue;
    }

    const row = mapBillingPlanToRow(planId, plan);
    await executor
      .insertInto("billing_plans")
      .values(row)
      .onConflict((oc) => oc.column("id").doUpdateSet({ data: row.data }))
      .execute();
  }

  for (const [operationKey, result] of idempotency) {
    await upsertBillingIdempotencyRow(executor, operationKey, result);
  }
}

export async function persistPostgresBillingUserSliceInTransaction(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository,
  userId: string
): Promise<void> {
  await db.transaction().execute((trx) => persistPostgresBillingUserSlice(trx, repository, userId));
}
