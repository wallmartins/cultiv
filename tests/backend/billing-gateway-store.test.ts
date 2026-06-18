import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect, Option } from "effect";
import { createPostgresBillingGatewayStore } from "../../apps/backend/src/infra/postgres-billing-gateway-store.js";
import {
  closePostgresTestDatabase,
  openPostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  type PostgresTestContext
} from "../../apps/backend/tests/postgres-test-helpers.js";

const shouldRunBillingGatewayPostgresTests =
  process.env.RUN_POSTGRES_TESTS === "true" && Boolean(process.env.BACKEND_TEST_DATABASE_URL);

const describeIfPostgres = shouldRunBillingGatewayPostgresTests ? describe : describe.skip;

async function clearBillingGatewayTables(
  db: PostgresTestContext["db"]
): Promise<void> {
  const tables = await db.introspection.getTables({ withInternalKyselyTables: false });
  if (!tables.some((table) => table.name === "billing_gateway_events")) {
    return;
  }

  await db.deleteFrom("billing_gateway_events").execute();
  await db.deleteFrom("billing_checkout_intents").execute();
  await db.deleteFrom("billing_gateway_subscriptions").execute();
  await db.deleteFrom("billing_gateway_customers").execute();
}

describeIfPostgres("postgres billing gateway store", () => {
  let postgres: PostgresTestContext;
  const now = "2026-06-17T12:00:00.000Z";

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

  beforeEach(async () => {
    await clearBillingGatewayTables(postgres.db);
  });

  it("inserts checkout intent", async () => {
    const store = createPostgresBillingGatewayStore(postgres.db);

    const intent = await Effect.runPromise(
      store.createCheckoutIntent({
        id: "intent_1",
        userId: "user_1",
        productKind: "subscription",
        internalRef: "pro",
        currency: "BRL",
        gateway: "asaas",
        status: "pending",
        createdAt: now
      })
    );

    expect(intent.id).toBe("intent_1");
    expect(intent.status).toBe("pending");
    expect(intent.completedAt).toBeNull();

    const loaded = await Effect.runPromise(store.getCheckoutIntent("intent_1"));
    expect(Option.isSome(loaded)).toBe(true);
    if (Option.isSome(loaded)) {
      expect(loaded.value.userId).toBe("user_1");
      expect(loaded.value.gateway).toBe("asaas");
    }
  });

  it("recordGatewayEvent deduplicates on same event_id", async () => {
    const store = createPostgresBillingGatewayStore(postgres.db);

    const first = await Effect.runPromise(
      store.recordGatewayEvent({
        eventId: "evt_1",
        gateway: "asaas",
        eventType: "checkout.completed",
        processedAt: now
      })
    );
    expect(first).toBe(true);

    const duplicate = await Effect.runPromise(
      store.recordGatewayEvent({
        eventId: "evt_1",
        gateway: "asaas",
        eventType: "checkout.completed",
        processedAt: now
      })
    );
    expect(duplicate).toBe(false);
  });
});
