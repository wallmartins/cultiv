import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBillingRepository } from "@my-ai-orchestrator/payments";
import {
  loadBillingRepository,
  saveBillingRepository
} from "../../apps/backend/src/infra/durable-store.js";
import {
  backfillBillingSnapshotIntoRelationalTables,
  hasPostgresBillingTables
} from "../../apps/backend/src/infra/postgres-billing-store.js";
import { registerBackendBillingPlans } from "../../apps/backend/src/product/billing/billing-bootstrap.js";
import { createPersistingBillingService } from "../../apps/backend/src/product/billing/durable-billing.js";
import { ensureDefaultFreeSubscription } from "@my-ai-orchestrator/payments";
import {
  clearBillingRelationalTables,
  clearDurableRuntimeTables,
  closePostgresTestDatabase,
  openPostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  type PostgresTestContext
} from "../../apps/backend/tests/postgres-test-helpers.js";

const shouldRunBillingPostgresTests =
  (process.env.RUN_POSTGRES_TESTS === "true" || process.env.RUN_DURABLE_RUNTIME_TESTS === "true") &&
  Boolean(process.env.BACKEND_TEST_DATABASE_URL);

const describeIfPostgres = shouldRunBillingPostgresTests ? describe : describe.skip;

describeIfPostgres("billing postgres persistence", () => {
  let postgres: PostgresTestContext;

  beforeAll(async () => {
    const available = await shouldRunPostgresIntegrationTests();
    if (!available) {
      throw new Error("PostgreSQL integration prerequisites are not available");
    }
    postgres = await openPostgresTestDatabase();
  }, 30_000);

  afterAll(async () => {
    await closePostgresTestDatabase(postgres);
  }, 30_000);

  it("round-trips billing state through relational tables", async () => {
    await clearDurableRuntimeTables(postgres.db);

    const repository = createBillingRepository();
    const now = () => new Date("2026-06-14T12:00:00.000Z");
    const billing = createPersistingBillingService(postgres.db, repository, now);

    await Effect.runPromise(registerBackendBillingPlans(billing));
    billing.upsertSubscription({
      id: "user-relational:pro:subscription",
      userId: "user-relational",
      planId: "pro",
      status: "active",
      startedAt: now().toISOString()
    });

    await Effect.runPromise(
      billing.startCycle({
        userId: "user-relational",
        planId: "pro",
        cycleId: "user-relational:pro:cycle:1",
        idempotencyKey: "billing-postgres:test:cycle"
      })
    );

    await Effect.runPromise(saveBillingRepository(postgres.db, repository, now().toISOString()));

    const reloaded = await Effect.runPromise(loadBillingRepository(postgres.db));

    expect(reloaded.subscriptions.has("user-relational:pro:subscription")).toBe(true);
    expect(reloaded.plans.size).toBeGreaterThan(0);
    expect(reloaded.ledger.length).toBeGreaterThan(0);

    const subscriptionRows = await postgres.db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("user_id", "=", "user-relational")
      .execute();

    expect(subscriptionRows).toHaveLength(1);
    expect(subscriptionRows[0]?.plan_id).toBe("pro");
  });

  it("backfills legacy billing snapshots into relational tables once", async () => {
    await clearDurableRuntimeTables(postgres.db);

    const repository = createBillingRepository();
    repository.subscriptions.set("user-legacy:free:subscription", {
      id: "user-legacy:free:subscription",
      userId: "user-legacy",
      planId: "free",
      status: "active",
      startedAt: "2026-06-14T12:00:00.000Z"
    });

    const snapshotPayload = {
      plans: Array.from(repository.plans.entries()),
      subscriptions: Array.from(repository.subscriptions.entries()),
      usage: [...repository.usage],
      ledger: [...repository.ledger],
      topUpPackages: Array.from(repository.topUpPackages.entries()),
      reservations: Array.from(repository.reservations.entries()),
      cycleStates: Array.from(repository.cycleStates.entries()),
      idempotency: Array.from(repository.idempotency.entries())
    };

    await postgres.db
      .insertInto("billing_snapshots")
      .values({
        id: "default",
        data: JSON.stringify(snapshotPayload),
        updated_at: "2026-06-14T12:00:00.000Z"
      })
      .execute();

    const backfilled = await Effect.runPromise(backfillBillingSnapshotIntoRelationalTables(postgres.db));
    expect(backfilled).toBe(true);

    const subscriptionRows = await postgres.db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("user_id", "=", "user-legacy")
      .execute();

    expect(subscriptionRows).toHaveLength(1);

    const backfilledAgain = await Effect.runPromise(backfillBillingSnapshotIntoRelationalTables(postgres.db));
    expect(backfilledAgain).toBe(false);
  });

  it("prefers relational billing tables when both snapshot and relational data exist", async () => {
    await clearDurableRuntimeTables(postgres.db);

    const relationalEnabled = await Effect.runPromise(hasPostgresBillingTables(postgres.db));
    expect(relationalEnabled).toBe(true);

    const repository = createBillingRepository();
    repository.subscriptions.set("user-prefer:pro:subscription", {
      id: "user-prefer:pro:subscription",
      userId: "user-prefer",
      planId: "pro",
      status: "active",
      startedAt: "2026-06-14T12:00:00.000Z"
    });

    await Effect.runPromise(saveBillingRepository(postgres.db, repository, "2026-06-14T12:00:00.000Z"));

    await postgres.db
      .insertInto("billing_snapshots")
      .values({
        id: "default",
        data: JSON.stringify({
          plans: [],
          subscriptions: [["stale:free:subscription", {
            id: "stale:free:subscription",
            userId: "stale",
            planId: "free",
            status: "active",
            startedAt: "2026-01-01T00:00:00.000Z"
          }]],
          usage: [],
          ledger: [],
          topUpPackages: [],
          reservations: [],
          cycleStates: [],
          idempotency: []
        }),
        updated_at: "2026-01-01T00:00:00.000Z"
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          data: JSON.stringify({
            plans: [],
            subscriptions: [["stale:free:subscription", {
              id: "stale:free:subscription",
              userId: "stale",
              planId: "free",
              status: "active",
              startedAt: "2026-01-01T00:00:00.000Z"
            }]],
            usage: [],
            ledger: [],
            topUpPackages: [],
            reservations: [],
            cycleStates: [],
            idempotency: []
          }),
          updated_at: "2026-01-01T00:00:00.000Z"
        })
      )
      .execute();

    const loaded = await Effect.runPromise(loadBillingRepository(postgres.db));

    expect(loaded.subscriptions.has("user-prefer:pro:subscription")).toBe(true);
    expect(loaded.subscriptions.has("stale:free:subscription")).toBe(false);

    await clearBillingRelationalTables(postgres.db);
  });

  it("persists ensureDefaultFreeSubscription across reload", async () => {
    await clearDurableRuntimeTables(postgres.db);

    const repository = createBillingRepository();
    const now = () => new Date("2026-06-14T12:00:00.000Z");
    const billing = createPersistingBillingService(postgres.db, repository, now);

    await Effect.runPromise(registerBackendBillingPlans(billing));
    await Effect.runPromise(
      ensureDefaultFreeSubscription(billing, "user-jit-free", {
        now,
        idempotencyNamespace: "jit"
      })
    );

    await Effect.runPromise(saveBillingRepository(postgres.db, repository, now().toISOString()));

    const reloaded = await Effect.runPromise(loadBillingRepository(postgres.db));
    const subscriptionId = "user-jit-free:free:subscription";

    expect(reloaded.subscriptions.has(subscriptionId)).toBe(true);
    expect(reloaded.ledger.length).toBeGreaterThan(0);
  });
});
