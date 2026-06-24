import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createBillingRepository } from "@my-ai-orchestrator/payments";
import {
  loadBillingRepository,
  reloadBillingRepositoryForUserInto
} from "../../apps/backend/src/infra/durable-store.js";
import { writePostgresBillingRepository } from "../../apps/backend/src/infra/postgres-billing-store.js";
import { drainBillingRepositoryPersistQueue } from "../../apps/backend/src/infra/billing/billing-persist-queue.js";
import { registerBackendBillingPlans } from "../../apps/backend/src/product/billing/billing-bootstrap.js";
import { createPersistingBillingService } from "../../apps/backend/src/product/billing/durable-billing.js";
import {
  clearDurableRuntimeTables,
  closePostgresTestDatabase,
  openPostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  type PostgresTestContext
} from "../../apps/backend/tests/postgres-test-helpers.js";

const shouldRunBillingBootTests =
  (process.env.RUN_POSTGRES_TESTS === "true" || process.env.RUN_DURABLE_RUNTIME_TESTS === "true") &&
  Boolean(process.env.BACKEND_TEST_DATABASE_URL);

const describeIfPostgres = shouldRunBillingBootTests ? describe : describe.skip;

describeIfPostgres("billing API boot lazy load", () => {
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

  it("boot loads catalog only; per-user hydration loads one user's slice", async () => {
    await clearDurableRuntimeTables(postgres.db);

    const now = () => new Date("2026-06-14T12:00:00.000Z");
    const seedRepository = createBillingRepository();
    const billing = createPersistingBillingService(postgres.db, seedRepository, now);

    await Effect.runPromise(registerBackendBillingPlans(billing));

    for (const userId of ["user-a", "user-b"] as const) {
      billing.upsertSubscription({
        id: `${userId}:pro:subscription`,
        userId,
        planId: "pro",
        status: "active",
        startedAt: now().toISOString()
      });
      await Effect.runPromise(
        billing.startCycle({
          userId,
          planId: "pro",
          cycleId: `${userId}:pro:cycle:1`,
          idempotencyKey: `boot-lazy:${userId}`
        })
      );
    }

    await writePostgresBillingRepository(postgres.db, seedRepository, { allowDestructiveReplace: true });

    const bootRepository = await Effect.runPromise(loadBillingRepository(postgres.db));

    expect(bootRepository.plans.size).toBeGreaterThan(0);
    expect(bootRepository.subscriptions.size).toBe(0);
    expect(bootRepository.ledger.length).toBe(0);
    expect(bootRepository.usage.length).toBe(0);
    expect(bootRepository.reservations.size).toBe(0);

    await Effect.runPromise(
      reloadBillingRepositoryForUserInto(postgres.db, bootRepository, "user-a")
    );

    expect(bootRepository.subscriptions.has("user-a:pro:subscription")).toBe(true);
    expect(bootRepository.subscriptions.has("user-b:pro:subscription")).toBe(false);
    expect(bootRepository.ledger.some((entry) => entry.accountId.startsWith("user-a:"))).toBe(true);
    expect(bootRepository.ledger.some((entry) => entry.accountId.startsWith("user-b:"))).toBe(false);
  });

  it("boot plan registration does not wipe other users' subscriptions in postgres", async () => {
    await clearDurableRuntimeTables(postgres.db);

    const now = () => new Date("2026-06-14T12:00:00.000Z");
    const seedRepository = createBillingRepository();
    const seedBilling = createPersistingBillingService(postgres.db, seedRepository, now);

    await Effect.runPromise(registerBackendBillingPlans(seedBilling));

    for (const userId of ["user-a", "user-b"] as const) {
      seedBilling.upsertSubscription({
        id: `${userId}:pro:subscription`,
        userId,
        planId: "pro",
        status: "active",
        startedAt: now().toISOString()
      });
      await Effect.runPromise(
        seedBilling.startCycle({
          userId,
          planId: "pro",
          cycleId: `${userId}:pro:cycle:1`,
          idempotencyKey: `boot-lazy:${userId}`
        })
      );
    }

    await drainBillingRepositoryPersistQueue();

    const bootRepository = await Effect.runPromise(loadBillingRepository(postgres.db));
    const bootBilling = createPersistingBillingService(postgres.db, bootRepository, now);
    await Effect.runPromise(registerBackendBillingPlans(bootBilling));
    await drainBillingRepositoryPersistQueue();

    const subscriptionRows = await postgres.db.selectFrom("billing_subscriptions").selectAll().execute();
    const userIds = subscriptionRows.map((row) => row.user_id).sort();

    expect(userIds).toEqual(["user-a", "user-b"]);
    expect(subscriptionRows.every((row) => row.plan_id === "pro")).toBe(true);
  });
});
