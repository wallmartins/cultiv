import { DatabaseError } from "@my-ai-orchestrator/database";
import { Effect } from "effect";
import { sql, type Kysely, type Transaction } from "kysely";
import { replaceBillingRepositoryContents } from "./billing-repository-sync.js";
import {
  hasPostgresBillingTables,
  loadPostgresBillingCatalog,
  persistPostgresBillingUserSlice,
  reloadPostgresBillingRepositoryInto,
  reloadPostgresBillingUserInto,
  runBillingRepositoryPersistSerialized,
  savePostgresBillingRepository,
  writePostgresBillingRepository
} from "./postgres-billing-store.js";
import {
  createBillingRepository,
  type BillingRepository
} from "@my-ai-orchestrator/payments";
import type { DatabaseTables } from "./postgres-tables.js";

const BILLING_SNAPSHOT_ID = "default";

type BillingDbExecutor = Kysely<DatabaseTables> | Transaction<DatabaseTables>;

interface BillingSnapshotPayload {
  readonly plans: ReadonlyArray<[string, unknown]>;
  readonly subscriptions: ReadonlyArray<[string, unknown]>;
  readonly usage: unknown[];
  readonly ledger: unknown[];
  readonly topUpPackages: ReadonlyArray<[string, unknown]>;
  readonly reservations: ReadonlyArray<[string, unknown]>;
  readonly cycleStates: ReadonlyArray<[string, unknown]>;
  readonly idempotency: ReadonlyArray<[string, unknown]>;
}

export function loadBillingRepository(
  db: Kysely<DatabaseTables>
): Effect.Effect<BillingRepository, never> {
  return Effect.gen(function* () {
    const relationalEnabled = yield* hasPostgresBillingTables(db);
    if (relationalEnabled) {
      return yield* loadPostgresBillingCatalog(db).pipe(
        Effect.catchAll(() => Effect.succeed(createBillingRepository()))
      );
    }

    return yield* loadBillingSnapshotRepository(db);
  });
}

function repositoryHasBillingData(repository: BillingRepository): boolean {
  return (
    repository.plans.size > 0 ||
    repository.subscriptions.size > 0 ||
    repository.ledger.length > 0 ||
    repository.usage.length > 0
  );
}

export { replaceBillingRepositoryContents, mergeBillingUserSliceInto, type BillingUserSlice } from "./billing-repository-sync.js";

export function reloadBillingRepositoryInto(
  db: Kysely<DatabaseTables>,
  target: BillingRepository
): Effect.Effect<void, never> {
  return Effect.gen(function* () {
    const relationalEnabled = yield* hasPostgresBillingTables(db);
    if (relationalEnabled) {
      yield* reloadPostgresBillingRepositoryInto(db, target).pipe(Effect.catchAll(() => Effect.void));
      if (repositoryHasBillingData(target)) {
        return;
      }
    }

    const loaded = yield* loadBillingSnapshotRepository(db);
    replaceBillingRepositoryContents(target, loaded);
  });
}

export function reloadBillingRepositoryForUserInto(
  db: Kysely<DatabaseTables>,
  target: BillingRepository,
  userId: string
): Effect.Effect<void, DatabaseError> {
  return Effect.gen(function* () {
    const relationalEnabled = yield* hasPostgresBillingTables(db);
    if (relationalEnabled) {
      yield* reloadPostgresBillingUserInto(db, target, userId);
      return;
    }

    const loaded = yield* loadBillingSnapshotRepository(db);
    replaceBillingRepositoryContents(target, loaded);
  }).pipe(
    Effect.mapError((cause) =>
      cause instanceof DatabaseError
        ? cause
        : new DatabaseError({
            operation: "reloadBillingRepositoryForUserInto",
            message: cause instanceof Error ? cause.message : String(cause),
            cause
          })
    )
  );
}

function loadBillingSnapshotRepository(
  db: Kysely<DatabaseTables>
): Effect.Effect<BillingRepository, never> {
  return Effect.gen(function* () {
    const row = yield* Effect.tryPromise({
      try: () =>
        db.selectFrom("billing_snapshots").where("id", "=", BILLING_SNAPSHOT_ID).selectAll().executeTakeFirst(),
      catch: () => undefined
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

    if (!row) {
      return createBillingRepository();
    }

    const payload = row.data as BillingSnapshotPayload;
    const repository = createBillingRepository({
      plans: payload.plans?.map(([, plan]) => plan) as never,
      subscriptions: (payload.subscriptions?.map(([, subscription]) => subscription) ?? []) as never,
      usage: (payload.usage ?? []) as never,
      ledger: (payload.ledger ?? []) as never,
      topUpPackages: (payload.topUpPackages?.map(([, pkg]) => pkg) ?? []) as never,
      reservations: (payload.reservations?.map(([, reservation]) => reservation) ?? []) as never,
      cycleStates: (payload.cycleStates?.map(([, state]) => state) ?? []) as never
    });
    for (const [key, value] of payload.idempotency ?? []) {
      repository.idempotency.set(key, value as never);
    }
    return repository;
  });
}

export function saveBillingRepositoryUnqueued(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository,
  updatedAt: string,
  options: { readonly allowDestructiveReplace?: boolean } = {}
): Effect.Effect<void, Error> {
  return Effect.gen(function* () {
    const relationalEnabled = yield* hasPostgresBillingTables(db);
    if (relationalEnabled) {
      yield* Effect.tryPromise({
        try: () => writePostgresBillingRepository(db, repository, options),
        catch: (error) => (error instanceof Error ? error : new Error(String(error)))
      });
      return;
    }

    const payload: BillingSnapshotPayload = {
      plans: Array.from(repository.plans.entries()),
      subscriptions: Array.from(repository.subscriptions.entries()),
      usage: [...repository.usage],
      ledger: [...repository.ledger],
      topUpPackages: Array.from(repository.topUpPackages.entries()),
      reservations: Array.from(repository.reservations.entries()),
      cycleStates: Array.from(repository.cycleStates.entries()),
      idempotency: Array.from(repository.idempotency.entries())
    };

    yield* Effect.tryPromise({
      try: () =>
        db
          .insertInto("billing_snapshots")
          .values({
            id: BILLING_SNAPSHOT_ID,
            data: JSON.stringify(payload),
            updated_at: updatedAt
          })
          .onConflict((oc) =>
            oc.column("id").doUpdateSet({
              data: JSON.stringify(payload),
              updated_at: updatedAt
            })
          )
          .execute(),
      catch: (error) => (error instanceof Error ? error : new Error(String(error)))
    });
  });
}

export function saveBillingRepository(
  db: Kysely<DatabaseTables>,
  repository: BillingRepository,
  updatedAt: string,
  options: { readonly allowDestructiveReplace?: boolean } = {}
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () =>
      runBillingRepositoryPersistSerialized(() =>
        Effect.runPromise(saveBillingRepositoryUnqueued(db, repository, updatedAt, options))
      ),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function persistBillingUserSliceInTransaction(
  trx: BillingDbExecutor,
  repository: BillingRepository,
  userId: string
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () => persistPostgresBillingUserSlice(trx, repository, userId),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function insertOutboxEvent(
  trx: Kysely<DatabaseTables>,
  event: {
    readonly id: string;
    readonly aggregateType: string;
    readonly aggregateId: string;
    readonly eventType: string;
    readonly payload: Readonly<Record<string, unknown>>;
    readonly occurredAt: string;
  }
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () =>
      trx
        .insertInto("outbox_events")
        .values({
          id: event.id,
          aggregate_type: event.aggregateType,
          aggregate_id: event.aggregateId,
          event_type: event.eventType,
          payload: JSON.stringify(event.payload),
          occurred_at: event.occurredAt,
          published_at: null
        })
        .execute(),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function listUnpublishedOutboxEvents(
  db: Kysely<DatabaseTables>,
  limit: number
): Effect.Effect<
  ReadonlyArray<{
    readonly id: string;
    readonly aggregateType: string;
    readonly aggregateId: string;
    readonly eventType: string;
    readonly payload: Readonly<Record<string, unknown>>;
    readonly occurredAt: string;
  }>,
  Error
> {
  return Effect.tryPromise({
    try: async () => {
      const rows = await sql<{
        id: string;
        aggregate_type: string;
        aggregate_id: string;
        event_type: string;
        payload: unknown;
        occurred_at: string;
      }>`select id, aggregate_type, aggregate_id, event_type, payload, occurred_at from outbox_events where published_at is null order by occurred_at asc limit ${limit} for update skip locked`.execute(
        db
      );

      return rows.rows.map((row) => ({
        id: row.id,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        eventType: row.event_type,
        payload:
          typeof row.payload === "string"
            ? (JSON.parse(row.payload) as Readonly<Record<string, unknown>>)
            : (row.payload as Readonly<Record<string, unknown>>),
        occurredAt: row.occurred_at
      }));
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function markOutboxEventPublished(
  db: Kysely<DatabaseTables>,
  id: string,
  publishedAt: string
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () =>
      db.updateTable("outbox_events").set({ published_at: publishedAt }).where("id", "=", id).execute(),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export interface ExecutionIdempotencyRecord {
  readonly userId: string;
  readonly idempotencyKey: string;
  readonly fingerprint: string;
  readonly executionId: string;
  readonly response: unknown;
  readonly createdAt: string;
}

export function findExecutionIdempotency(
  db: Kysely<DatabaseTables>,
  userId: string,
  idempotencyKey: string
): Effect.Effect<ExecutionIdempotencyRecord | undefined, Error> {
  return Effect.tryPromise({
    try: async () => {
      const row = await db
        .selectFrom("execution_idempotency")
        .selectAll()
        .where("user_id", "=", userId)
        .where("idempotency_key", "=", idempotencyKey)
        .executeTakeFirst();

      if (!row) {
        return undefined;
      }

      return {
        userId: row.user_id,
        idempotencyKey: row.idempotency_key,
        fingerprint: row.fingerprint,
        executionId: row.execution_id,
        response:
          typeof row.response === "string" ? JSON.parse(row.response) : row.response,
        createdAt: row.created_at
      };
    },
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}

export function upsertExecutionIdempotency(
  db: Kysely<DatabaseTables>,
  record: ExecutionIdempotencyRecord
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    try: () =>
      db
        .insertInto("execution_idempotency")
        .values({
          user_id: record.userId,
          idempotency_key: record.idempotencyKey,
          fingerprint: record.fingerprint,
          execution_id: record.executionId,
          response: JSON.stringify(record.response),
          created_at: record.createdAt
        })
        .onConflict((oc) =>
          oc.columns(["user_id", "idempotency_key"]).doUpdateSet({
            fingerprint: record.fingerprint,
            execution_id: record.executionId,
            response: JSON.stringify(record.response),
            created_at: record.createdAt
          })
        )
        .execute(),
    catch: (error) => (error instanceof Error ? error : new Error(String(error)))
  });
}
