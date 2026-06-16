// src/infra/migrations/0006-billing-relational.ts
import { Effect as Effect3 } from "effect";
import { sql } from "kysely";

// src/infra/postgres-billing-store.ts
import { Effect as Effect2 } from "effect";

// ../../packages/payments/src/index.ts
import { Context, Effect, Layer } from "effect";

// ../../packages/payments/src/errors.ts
import { Data } from "effect";
var BillingPlanInvalidError = class extends Data.TaggedError("BillingPlanInvalidError") {
};
var BillingPlanNotFoundError = class extends Data.TaggedError("BillingPlanNotFoundError") {
};
var BillingEntitlementNotFoundError = class extends Data.TaggedError("BillingEntitlementNotFoundError") {
};
var BillingSubscriptionInactiveError = class extends Data.TaggedError("BillingSubscriptionInactiveError") {
};
var BillingInsufficientCreditsError = class extends Data.TaggedError("BillingInsufficientCreditsError") {
};
var BillingTopUpPackageNotFoundError = class extends Data.TaggedError("BillingTopUpPackageNotFoundError") {
};
var BillingReservationNotFoundError = class extends Data.TaggedError("BillingReservationNotFoundError") {
};
var BillingOperationConflictError = class extends Data.TaggedError("BillingOperationConflictError") {
};

// ../../packages/payments/src/index.ts
var BillingService = class extends Context.Tag("BillingService")() {
};
var DEFAULT_BILLING_PLANS = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    monthlyCredits: 50,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: false }
    ],
    allowedModels: ["llama3.1", "gpt-4o-mini"]
  },
  {
    id: "pro",
    tier: "pro",
    name: "Pro",
    monthlyCredits: 2500,
    dailyCredits: 300,
    features: [
      { key: "execution.sync_mode", enabled: true },
      { key: "content.language.refinement", enabled: true },
      { key: "rollout.beta.access", enabled: true }
    ],
    allowedModels: ["gpt-4o-mini", "gpt-4.1", "claude-3-5-sonnet"]
  }
];
function createBillingRepository(seed = {}) {
  return {
    plans: new Map((seed.plans ?? DEFAULT_BILLING_PLANS).map((plan) => [plan.id, plan])),
    subscriptions: new Map((seed.subscriptions ?? []).map((subscription) => [subscription.id, subscription])),
    usage: [...seed.usage ?? []],
    ledger: [...seed.ledger ?? []],
    topUpPackages: new Map((seed.topUpPackages ?? []).map((pkg) => [pkg.id, pkg])),
    reservations: new Map((seed.reservations ?? []).map((reservation) => [reservation.reservationId, reservation])),
    cycleStates: new Map((seed.cycleStates ?? []).map((state) => [state.accountId, state])),
    idempotency: /* @__PURE__ */ new Map()
  };
}

// src/infra/postgres-billing-store.ts
var BILLING_SNAPSHOT_ID = "default";
var billingPersistQueue = Promise.resolve();
function runBillingRepositoryPersistSerialized(task) {
  const next = billingPersistQueue.catch(() => void 0).then(task);
  billingPersistQueue = next.then(
    () => void 0,
    () => void 0
  );
  return next;
}
function savePostgresBillingRepository(db, repository) {
  return Effect2.tryPromise({
    try: () => runBillingRepositoryPersistSerialized(
      () => db.transaction().execute(async (trx) => {
        await clearBillingTables(trx);
        await insertBillingRepository(trx, repository);
      })
    ),
    catch: (error) => error instanceof Error ? error : new Error(String(error))
  });
}
function backfillBillingSnapshotIntoRelationalTables(db) {
  return Effect2.gen(function* () {
    const snapshotRow = yield* Effect2.tryPromise({
      try: () => db.selectFrom("billing_snapshots").where("id", "=", BILLING_SNAPSHOT_ID).selectAll().executeTakeFirst(),
      catch: (error) => error instanceof Error ? error : new Error(String(error))
    });
    if (!snapshotRow) {
      return false;
    }
    const existingPlans = yield* Effect2.tryPromise({
      try: () => db.selectFrom("billing_plans").select("id").limit(1).execute(),
      catch: (error) => error instanceof Error ? error : new Error(String(error))
    });
    if (existingPlans.length > 0) {
      return false;
    }
    const payload = snapshotRow.data;
    const repository = createBillingRepository({
      plans: payload.plans?.map(([, plan]) => plan) ?? [],
      subscriptions: payload.subscriptions?.map(([, subscription]) => subscription) ?? [],
      usage: payload.usage ?? [],
      ledger: payload.ledger ?? [],
      topUpPackages: payload.topUpPackages?.map(([, pkg]) => pkg) ?? [],
      reservations: payload.reservations?.map(([, reservation]) => reservation) ?? [],
      cycleStates: payload.cycleStates?.map(([, state]) => state) ?? []
    });
    for (const [key, value] of payload.idempotency ?? []) {
      repository.idempotency.set(key, value);
    }
    yield* savePostgresBillingRepository(db, repository);
    return true;
  });
}
async function clearBillingTables(trx) {
  await trx.deleteFrom("billing_operation_idempotency").execute();
  await trx.deleteFrom("billing_reservations").execute();
  await trx.deleteFrom("billing_ledger_entries").execute();
  await trx.deleteFrom("billing_usage_records").execute();
  await trx.deleteFrom("billing_cycle_states").execute();
  await trx.deleteFrom("billing_top_up_packages").execute();
  await trx.deleteFrom("billing_subscriptions").execute();
  await trx.deleteFrom("billing_plans").execute();
}
async function insertBillingRepository(trx, repository) {
  if (repository.plans.size > 0) {
    await trx.insertInto("billing_plans").values(
      Array.from(repository.plans.entries()).map(([id, plan]) => ({
        id,
        data: plan
      }))
    ).execute();
  }
  if (repository.subscriptions.size > 0) {
    await trx.insertInto("billing_subscriptions").values(
      Array.from(repository.subscriptions.values()).map((subscription) => ({
        id: subscription.id,
        user_id: subscription.userId,
        plan_id: subscription.planId,
        status: subscription.status,
        started_at: subscription.startedAt,
        renewed_at: subscription.renewedAt ?? null,
        expires_at: subscription.expiresAt ?? null
      }))
    ).execute();
  }
  if (repository.usage.length > 0) {
    await trx.insertInto("billing_usage_records").values(
      repository.usage.map((entry) => ({
        id: entry.id,
        user_id: entry.userId,
        plan_id: entry.planId,
        subscription_id: entry.subscriptionId,
        kind: entry.kind,
        amount: entry.amount,
        credits: entry.credits,
        created_at: entry.createdAt,
        metadata: entry.metadata ?? {}
      }))
    ).execute();
  }
  if (repository.ledger.length > 0) {
    await trx.insertInto("billing_ledger_entries").values(
      repository.ledger.map((entry) => ({
        subscription_id: entry.subscriptionId,
        account_id: entry.accountId,
        entry_type: entry.entryType,
        credits_delta: entry.creditsDelta,
        balance_after: entry.balanceAfter,
        reference_type: entry.referenceType,
        reference_id: entry.referenceId,
        idempotency_key: entry.idempotencyKey,
        metadata: entry.metadata,
        created_at: entry.createdAt
      }))
    ).execute();
  }
  if (repository.reservations.size > 0) {
    await trx.insertInto("billing_reservations").values(
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
        metadata: reservation.metadata,
        created_at: reservation.createdAt,
        updated_at: reservation.updatedAt
      }))
    ).execute();
  }
  if (repository.cycleStates.size > 0) {
    await trx.insertInto("billing_cycle_states").values(
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
    ).execute();
  }
  if (repository.topUpPackages.size > 0) {
    await trx.insertInto("billing_top_up_packages").values(
      Array.from(repository.topUpPackages.values()).map((pkg) => ({
        id: pkg.id,
        credits: pkg.credits,
        price_cents: pkg.priceCents,
        currency: pkg.currency,
        description: pkg.description ?? null
      }))
    ).execute();
  }
  if (repository.idempotency.size > 0) {
    await trx.insertInto("billing_operation_idempotency").values(
      Array.from(repository.idempotency.entries()).map(([operationKey, result]) => ({
        operation_key: operationKey,
        result
      }))
    ).execute();
  }
}

// src/infra/migrations/0006-billing-relational.ts
async function up(db) {
  await db.schema.createTable("billing_plans").addColumn("id", "varchar(64)", (col) => col.primaryKey()).addColumn("data", "jsonb", (col) => col.notNull()).execute();
  await db.schema.createTable("billing_subscriptions").addColumn("id", "varchar(128)", (col) => col.primaryKey()).addColumn("user_id", "varchar(64)", (col) => col.notNull()).addColumn("plan_id", "varchar(64)", (col) => col.notNull()).addColumn("status", "varchar(32)", (col) => col.notNull()).addColumn("started_at", "varchar(64)", (col) => col.notNull()).addColumn("renewed_at", "varchar(64)").addColumn("expires_at", "varchar(64)").execute();
  await db.schema.createIndex("billing_subscriptions_user_id_idx").on("billing_subscriptions").column("user_id").execute();
  await db.schema.createIndex("billing_subscriptions_user_plan_idx").on("billing_subscriptions").columns(["user_id", "plan_id"]).execute();
  await db.schema.createTable("billing_usage_records").addColumn("id", "varchar(128)", (col) => col.primaryKey()).addColumn("user_id", "varchar(64)", (col) => col.notNull()).addColumn("plan_id", "varchar(64)", (col) => col.notNull()).addColumn("subscription_id", "varchar(128)", (col) => col.notNull()).addColumn("kind", "varchar(32)", (col) => col.notNull()).addColumn("amount", "double precision", (col) => col.notNull()).addColumn("credits", "double precision", (col) => col.notNull()).addColumn("created_at", "varchar(64)", (col) => col.notNull()).addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`)).execute();
  await db.schema.createIndex("billing_usage_records_user_id_idx").on("billing_usage_records").column("user_id").execute();
  await db.schema.createTable("billing_ledger_entries").addColumn("id", "bigserial", (col) => col.primaryKey()).addColumn("subscription_id", "varchar(128)", (col) => col.notNull()).addColumn("account_id", "varchar(128)", (col) => col.notNull()).addColumn("entry_type", "varchar(32)", (col) => col.notNull()).addColumn("credits_delta", "double precision", (col) => col.notNull()).addColumn("balance_after", "double precision", (col) => col.notNull()).addColumn("reference_type", "varchar(32)", (col) => col.notNull()).addColumn("reference_id", "varchar(255)", (col) => col.notNull()).addColumn("idempotency_key", "varchar(255)", (col) => col.notNull()).addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`)).addColumn("created_at", "varchar(64)", (col) => col.notNull()).execute();
  await sql`create unique index billing_ledger_entries_idempotency_key_idx on billing_ledger_entries (idempotency_key)`.execute(
    db
  );
  await db.schema.createIndex("billing_ledger_entries_account_created_idx").on("billing_ledger_entries").columns(["account_id", "id"]).execute();
  await db.schema.createTable("billing_reservations").addColumn("reservation_id", "varchar(255)", (col) => col.primaryKey()).addColumn("generation_cycle_id", "varchar(255)", (col) => col.notNull()).addColumn("subscription_id", "varchar(128)", (col) => col.notNull()).addColumn("account_id", "varchar(128)", (col) => col.notNull()).addColumn("quality_mode", "varchar(16)", (col) => col.notNull()).addColumn("retry_count", "integer", (col) => col.notNull()).addColumn("reserved_credits", "double precision", (col) => col.notNull()).addColumn("status", "varchar(16)", (col) => col.notNull()).addColumn("idempotency_key", "varchar(255)", (col) => col.notNull()).addColumn("metadata", "jsonb", (col) => col.notNull().defaultTo(sql`'{}'::jsonb`)).addColumn("created_at", "varchar(64)", (col) => col.notNull()).addColumn("updated_at", "varchar(64)", (col) => col.notNull()).execute();
  await sql`create unique index billing_reservations_idempotency_key_idx on billing_reservations (idempotency_key)`.execute(
    db
  );
  await db.schema.createIndex("billing_reservations_account_status_idx").on("billing_reservations").columns(["account_id", "status"]).execute();
  await db.schema.createTable("billing_cycle_states").addColumn("account_id", "varchar(128)", (col) => col.primaryKey()).addColumn("cycle_id", "varchar(255)", (col) => col.notNull()).addColumn("subscription_id", "varchar(128)", (col) => col.notNull()).addColumn("opened_at", "varchar(64)", (col) => col.notNull()).addColumn("closed_at", "varchar(64)").addColumn("rollover_credits", "double precision", (col) => col.notNull()).addColumn("granted_credits", "double precision", (col) => col.notNull()).addColumn("expired_credits", "double precision", (col) => col.notNull()).execute();
  await db.schema.createTable("billing_top_up_packages").addColumn("id", "varchar(64)", (col) => col.primaryKey()).addColumn("credits", "double precision", (col) => col.notNull()).addColumn("price_cents", "integer", (col) => col.notNull()).addColumn("currency", "varchar(8)", (col) => col.notNull()).addColumn("description", "text").execute();
  await db.schema.createTable("billing_operation_idempotency").addColumn("operation_key", "varchar(512)", (col) => col.primaryKey()).addColumn("result", "jsonb", (col) => col.notNull()).execute();
  await Effect3.runPromise(backfillBillingSnapshotIntoRelationalTables(db));
}
async function down(db) {
  await db.schema.dropTable("billing_operation_idempotency").execute();
  await db.schema.dropTable("billing_top_up_packages").execute();
  await db.schema.dropTable("billing_cycle_states").execute();
  await db.schema.dropTable("billing_reservations").execute();
  await db.schema.dropTable("billing_ledger_entries").execute();
  await db.schema.dropTable("billing_usage_records").execute();
  await db.schema.dropTable("billing_subscriptions").execute();
  await db.schema.dropTable("billing_plans").execute();
}
export {
  down,
  up
};
//# sourceMappingURL=0006-billing-relational.js.map
