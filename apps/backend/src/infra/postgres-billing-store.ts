import { Effect } from "effect";
import type { Kysely, Transaction } from "kysely";
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
  type BillingRepository,
  type BillingSubscription,
  type BillingUsageRecord
} from "@my-ai-orchestrator/payments";
import type { DatabaseTables } from "./postgres-tables.js";
import { replaceBillingRepositoryContents } from "./billing-repository-sync.js";

const BILLING_SNAPSHOT_ID = "default";

type BillingDbExecutor = Kysely<DatabaseTables> | Transaction<DatabaseTables>;

let billingPersistQueue: Promise<void> = Promise.resolve();

export function runBillingRepositoryPersistSerialized<T>(task: () => Promise<T>): Promise<T> {
  const next = billingPersistQueue.catch(() => undefined).then(task);
  billingPersistQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function drainBillingRepositoryPersistQueue(): Promise<void> {
  return billingPersistQueue.catch(() => undefined);
}

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
        plans: plans.map((row) => row.data as BillingPlanDefinition),
        subscriptions: subscriptions.map(
          (row) =>
            ({
              id: row.id,
              userId: row.user_id,
              planId: row.plan_id,
              status: row.status,
              startedAt: row.started_at,
              ...(row.renewed_at ? { renewedAt: row.renewed_at } : {}),
              ...(row.expires_at ? { expiresAt: row.expires_at } : {})
            }) as BillingSubscription
        ),
        usage: usage.map(
          (row) =>
            ({
              id: row.id,
              userId: row.user_id,
              subscriptionId: row.subscription_id,
              planId: row.plan_id,
              kind: row.kind,
              amount: row.amount,
              credits: row.credits,
              createdAt: row.created_at,
              metadata: (row.metadata ?? {}) as Record<string, unknown>
            }) as BillingUsageRecord
        ),
        ledger: ledger.map(
          (row) =>
            ({
              subscriptionId: row.subscription_id,
              accountId: row.account_id,
              entryType: row.entry_type,
              creditsDelta: row.credits_delta,
              balanceAfter: row.balance_after,
              referenceType: row.reference_type,
              referenceId: row.reference_id,
              idempotencyKey: row.idempotency_key,
              metadata: (row.metadata ?? {}) as Record<string, unknown>,
              createdAt: row.created_at
            }) as BillingLedgerEntry
        ),
        reservations: reservations.map(
          (row) =>
            ({
              reservationId: row.reservation_id,
              generationCycleId: row.generation_cycle_id,
              subscriptionId: row.subscription_id,
              accountId: row.account_id,
              qualityMode: row.quality_mode,
              retryCount: row.retry_count,
              reservedCredits: row.reserved_credits,
              status: row.status,
              idempotencyKey: row.idempotency_key,
              metadata: (row.metadata ?? {}) as Record<string, unknown>,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            }) as BillingGenerationReservation
        ),
        cycleStates: cycleStates.map(
          (row) =>
            ({
              cycleId: row.cycle_id,
              subscriptionId: row.subscription_id,
              accountId: row.account_id,
              openedAt: row.opened_at,
              closedAt: row.closed_at,
              rolloverCredits: row.rollover_credits,
              grantedCredits: row.granted_credits,
              expiredCredits: row.expired_credits
            }) as BillingCycleState
        ),
        topUpPackages: topUpPackages.map(
          (row) =>
            ({
              id: row.id,
              credits: row.credits,
              priceCents: row.price_cents,
              currency: row.currency,
              ...(row.description ? { description: row.description } : {})
            }) as BillingTopUpPackage
        )
      });

      for (const row of idempotency) {
        repository.idempotency.set(row.operation_key, row.result as BillingOperationResult<unknown>);
      }

      return repository;
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function savePostgresBillingRepository(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () =>
      runBillingRepositoryPersistSerialized(() =>
        db.transaction().execute(async (trx) => {
          await clearBillingTables(trx);
          await insertBillingRepository(trx, repository);
        })
      ),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function persistPostgresBillingRepositoryInTransaction(
  trx: BillingDbExecutor,
  repository: BillingRepository
): Promise<void> {
  return runBillingRepositoryPersistSerialized(async () => {
    await clearBillingTables(trx);
    await insertBillingRepository(trx, repository);
  });
}

export function backfillBillingSnapshotIntoRelationalTables(
  db: Kysely<DatabaseTables>
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

    yield* savePostgresBillingRepository(db, repository);
    return true;
  });
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
      .values(
        Array.from(repository.plans.entries()).map(([id, plan]) => ({
          id,
          data: plan as unknown as Record<string, unknown>
        }))
      )
      .execute();
  }

  if (repository.subscriptions.size > 0) {
    await trx
      .insertInto("billing_subscriptions")
      .values(
        Array.from(repository.subscriptions.values()).map((subscription) => ({
          id: subscription.id,
          user_id: subscription.userId,
          plan_id: subscription.planId,
          status: subscription.status,
          started_at: subscription.startedAt,
          renewed_at: subscription.renewedAt ?? null,
          expires_at: subscription.expiresAt ?? null
        }))
      )
      .execute();
  }

  if (repository.usage.length > 0) {
    await trx
      .insertInto("billing_usage_records")
      .values(
        repository.usage.map((entry) => ({
          id: entry.id,
          user_id: entry.userId,
          plan_id: entry.planId,
          subscription_id: entry.subscriptionId,
          kind: entry.kind,
          amount: entry.amount,
          credits: entry.credits,
          created_at: entry.createdAt,
          metadata: (entry.metadata ?? {}) as Record<string, unknown>
        }))
      )
      .execute();
  }

  if (repository.ledger.length > 0) {
    await trx
      .insertInto("billing_ledger_entries")
      .values(
        repository.ledger.map((entry) => ({
          subscription_id: entry.subscriptionId,
          account_id: entry.accountId,
          entry_type: entry.entryType,
          credits_delta: entry.creditsDelta,
          balance_after: entry.balanceAfter,
          reference_type: entry.referenceType,
          reference_id: entry.referenceId,
          idempotency_key: entry.idempotencyKey,
          metadata: entry.metadata as Record<string, unknown>,
          created_at: entry.createdAt
        }))
      )
      .execute();
  }

  if (repository.reservations.size > 0) {
    await trx
      .insertInto("billing_reservations")
      .values(
        Array.from(repository.reservations.values()).map((reservation) => ({
          reservation_id: reservation.reservationId,
          generation_cycle_id: reservation.generationCycleId,
          subscription_id: reservation.subscriptionId,
          account_id: reservation.accountId,
          quality_mode: reservation.qualityMode,
          retry_count: reservation.retryCount,
          reserved_credits: reservation.reservedCredits,
          status: reservation.status,
          idempotency_key: reservation.idempotencyKey,
          metadata: reservation.metadata as Record<string, unknown>,
          created_at: reservation.createdAt,
          updated_at: reservation.updatedAt
        }))
      )
      .execute();
  }

  if (repository.cycleStates.size > 0) {
    await trx
      .insertInto("billing_cycle_states")
      .values(
        Array.from(repository.cycleStates.values()).map((state) => ({
          account_id: state.accountId,
          cycle_id: state.cycleId,
          subscription_id: state.subscriptionId,
          opened_at: state.openedAt,
          closed_at: state.closedAt,
          rollover_credits: state.rolloverCredits,
          granted_credits: state.grantedCredits,
          expired_credits: state.expiredCredits
        }))
      )
      .execute();
  }

  if (repository.topUpPackages.size > 0) {
    await trx
      .insertInto("billing_top_up_packages")
      .values(
        Array.from(repository.topUpPackages.values()).map((pkg) => ({
          id: pkg.id,
          credits: pkg.credits,
          price_cents: pkg.priceCents,
          currency: pkg.currency,
          description: pkg.description ?? null
        }))
      )
      .execute();
  }

  if (repository.idempotency.size > 0) {
    await trx
      .insertInto("billing_operation_idempotency")
      .values(
        Array.from(repository.idempotency.entries()).map(([operationKey, result]) => ({
          operation_key: operationKey,
          result: result as unknown as Record<string, unknown>
        }))
      )
      .execute();
  }
}
