import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPostgresDatabaseClient } from "../src/infra/postgres-client.js";
import { createPostgresMemoryRepository } from "../src/infra/postgres-repositories/postgres-memory-repository.js";
import { createPostgresVoiceExampleRepository } from "../src/infra/postgres-repositories/postgres-voice-example-repository.js";
import { createPostgresExecutionReactionRepository } from "../src/infra/postgres-repositories/postgres-execution-reaction-repository.js";
import { createPostgresVoiceTrainingConsentRepository } from "../src/infra/postgres-repositories/postgres-voice-training-consent-repository.js";
import { createPostgresApplicationUserRepository } from "../src/infra/postgres-repositories/postgres-application-user-repository.js";
import { runAccountDeleteTransaction, runAccountResetTransaction } from "../src/product/account/account-purge-transaction.js";
import {
  backendTestDatabaseUrl,
  closePostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  openPostgresTestDatabase,
  type PostgresTestContext
} from "./postgres-test-helpers.js";

const describeIfPostgres = backendTestDatabaseUrl && await shouldRunPostgresIntegrationTests()
  ? describe
  : describe.skip;

// vitest.config.ts runs postgres suite files in parallel (fileParallelism, unless
// VITEST_DURABLE_SUITE=true) against ONE shared database — an unscoped `DELETE FROM x` (the
// pattern the other postgres-*.test.ts files use, e.g. clearApplicationUsers) races with whatever
// other file is concurrently mid-test on the same table. All fixtures in this file use an
// "acct-"-prefixed id/userId, so cleanup is scoped to that prefix instead, to stay out of other
// files' way.
const TEST_ID_PREFIX = "acct-";

async function clearAccountTestTables(context: PostgresTestContext): Promise<void> {
  const like = `${TEST_ID_PREFIX}%`;
  await context.db.deleteFrom("jobs").where("user_id", "like", like).execute();
  await context.db.deleteFrom("memories").where("user_id", "like", like).execute();
  await context.db.deleteFrom("voice_examples").where("user_id", "like", like).execute();
  await context.db.deleteFrom("voice_training_consents").where("user_id", "like", like).execute();
  await context.db.deleteFrom("execution_reactions").where("user_id", "like", like).execute();
  await context.db.deleteFrom("execution_idempotency").where("user_id", "like", like).execute();
  await context.db.deleteFrom("outbox_events").where("aggregate_id", "like", like).execute();
  await context.db.deleteFrom("billing_subscriptions").where("user_id", "like", like).execute();
  // usage_records.id / reservations.reservation_id are fixed test-fixture PKs that anonymization
  // deliberately does NOT rewrite (only subscription_id/user_id/account_id do — see the fix #1 note
  // in postgres-billing-anonymization.ts), so a delete-tested row can outlive its own user_id
  // filter match; also clear by the fixture's own id/reservation_id prefix to avoid a PK collision
  // on the next run.
  await context.db.deleteFrom("billing_usage_records").where("user_id", "like", like).execute();
  await context.db.deleteFrom("billing_usage_records").where("id", "like", like).execute();
  await context.db.deleteFrom("billing_ledger_entries").where("account_id", "like", like).execute();
  // idempotency_key is unique and, unlike account_id, never anonymized — the same orphan risk.
  await context.db.deleteFrom("billing_ledger_entries").where("idempotency_key", "like", like).execute();
  await context.db.deleteFrom("billing_reservations").where("account_id", "like", like).execute();
  await context.db.deleteFrom("billing_reservations").where("reservation_id", "like", like).execute();
  await context.db.deleteFrom("billing_cycle_states").where("account_id", "like", like).execute();
  await context.db.deleteFrom("billing_gateway_subscriptions").where("subscription_id", "like", like).execute();
  await context.db.deleteFrom("billing_gateway_customers").where("user_id", "like", like).execute();
  await context.db.deleteFrom("billing_checkout_intents").where("user_id", "like", like).execute();
  // operation_key is "reserve:<userId>:cycle-1" — the prefix is elsewhere in the key.
  await context.db
    .deleteFrom("billing_operation_idempotency")
    .where("operation_key", "like", `%${TEST_ID_PREFIX}%`)
    .execute();
  await context.db.deleteFrom("application_users").where("id", "like", like).execute();
}

// contract-08 §5 task 3 runnable check + coordinator fix #1/#3 — seeds a user's full billing
// footprint (subscription + usage + ledger + reservation + cycle state + gateway subscription +
// gateway customer + checkout intent + idempotency), deletes, and proves NO retained billing
// column anywhere carries the original userId — the core "irreversible" guarantee of decision 2.
function billingUserIdCandidateColumns() {
  // every column in every billing table that could conceivably carry the raw userId: user_id,
  // account_id, subscription_id, id, external_customer_id, operation_key.
  return [
    { table: "billing_subscriptions", column: "id" },
    { table: "billing_subscriptions", column: "user_id" },
    { table: "billing_usage_records", column: "subscription_id" },
    { table: "billing_usage_records", column: "user_id" },
    { table: "billing_ledger_entries", column: "subscription_id" },
    { table: "billing_ledger_entries", column: "account_id" },
    { table: "billing_reservations", column: "subscription_id" },
    { table: "billing_reservations", column: "account_id" },
    { table: "billing_cycle_states", column: "subscription_id" },
    { table: "billing_cycle_states", column: "account_id" },
    { table: "billing_gateway_subscriptions", column: "subscription_id" }
  ] as const;
}

describeIfPostgres("PostgreSQL account delete/reset transactions", () => {
  let context: PostgresTestContext;

  beforeAll(async () => {
    context = await openPostgresTestDatabase();
  });

  afterAll(async () => {
    await closePostgresTestDatabase(context);
  });

  beforeEach(async () => {
    await clearAccountTestTables(context);
  });

  async function seedUserWithFullFootprint(userId: string, externalSubject: string) {
    const users = createPostgresApplicationUserRepository(context.db);
    await Effect.runPromise(users.create({ id: userId, externalSubject, status: "active" }));

    const now = new Date().toISOString();
    // JobRepository.create() never sets the user_id COLUMN (only execution-enqueue-transaction.ts's
    // raw insert does, mirrored here) — jobs.removeByUser/WHERE filters key off that column.
    await context.db
      .insertInto("jobs")
      .values({
        id: `${userId}-job-1`,
        user_id: userId,
        data: JSON.stringify({
          id: `${userId}-job-1`,
          status: "done",
          executionMode: "sync",
          contentType: "twitter-thread",
          createdAt: now,
          completedAt: now,
          updatedAt: now,
          version: 1,
          progress: { currentStep: "done", stepIndex: 1, totalSteps: 1, percent: 100 },
          progressHistory: [],
          result: null,
          error: null,
          history: []
        }),
        version: 1,
        created_at: now,
        updated_at: now
      })
      .execute();

    const memories = createPostgresMemoryRepository(context.db);
    await Effect.runPromise(
      memories.put({ id: `${userId}:pref`, userId, key: "pref", value: { x: 1 }, createdAt: now, updatedAt: now })
    );

    const voiceExamples = createPostgresVoiceExampleRepository(context.db);
    await Effect.runPromise(
      voiceExamples.create({
        id: `${userId}-example-1`,
        userId,
        text: "Minha voz autêntica.",
        language: "pt-BR",
        state: "active",
        classificationLabels: ["positive"],
        antiPatternsExplicit: [],
        pinned: false,
        pendingProfileImpact: true,
        effectiveContentTypeHints: [],
        evaluation: {
          systemWeight: 0.5,
          attentionLevel: "medium",
          attentionReasonCodes: [],
          contributionCode: "supports_first_person_voice"
        },
        createdAt: now,
        updatedAt: now
      } as any)
    );

    const executionReactions = createPostgresExecutionReactionRepository(context.db);
    await Effect.runPromise(
      executionReactions.upsert({
        executionId: `${userId}-job-1`,
        userId,
        reaction: "up",
        createdAt: now,
        updatedAt: now
      })
    );

    const planId = "pro";
    const subscriptionId = `${userId}:${planId}:subscription`;
    await context.db
      .insertInto("billing_subscriptions")
      .values({
        id: subscriptionId,
        user_id: userId,
        plan_id: planId,
        status: "active",
        started_at: now,
        renewed_at: null,
        expires_at: null,
        trial_ends_at: null,
        renews_at: null,
        ever_subscribed: true
      })
      .execute();

    await context.db
      .insertInto("billing_usage_records")
      .values({
        id: `${userId}-usage-1`,
        user_id: userId,
        plan_id: planId,
        subscription_id: subscriptionId,
        kind: "generation",
        amount: 42,
        credits: 1,
        created_at: now,
        metadata: JSON.stringify({})
      })
      .execute();

    const accountId = `${userId}:${planId}`;
    await context.db
      .insertInto("billing_ledger_entries")
      .values({
        subscription_id: subscriptionId,
        account_id: accountId,
        entry_type: "capture",
        credits_delta: -1,
        balance_after: 9,
        reference_type: "generation",
        reference_id: `${userId}-job-1`,
        idempotency_key: `${userId}-ledger-1`,
        metadata: JSON.stringify({}),
        created_at: now
      })
      .execute();

    await context.db
      .insertInto("billing_reservations")
      .values({
        reservation_id: `${userId}-reservation-1`,
        generation_cycle_id: `${userId}-cycle-1`,
        subscription_id: subscriptionId,
        account_id: accountId,
        quality_mode: "balanced",
        retry_count: 0,
        reserved_credits: 1,
        status: "captured",
        idempotency_key: `${userId}-reservation-idem-1`,
        metadata: JSON.stringify({}),
        created_at: now,
        updated_at: now
      })
      .execute();

    await context.db
      .insertInto("billing_cycle_states")
      .values({
        account_id: accountId,
        cycle_id: `${userId}-cycle-1`,
        subscription_id: subscriptionId,
        opened_at: now,
        closed_at: null,
        rollover_credits: 0,
        granted_credits: 10,
        expired_credits: 0
      })
      .execute();

    await context.db
      .insertInto("billing_gateway_subscriptions")
      .values({
        subscription_id: subscriptionId,
        gateway: "stripe",
        external_subscription_id: "sub_external_123",
        status: "active",
        currency: "USD",
        updated_at: now,
        payment_method_kind: "card",
        payment_method_brand_last4: "4242",
        outstanding_invoice_url: null
      })
      .execute();

    await context.db
      .insertInto("billing_gateway_customers")
      .values({ user_id: userId, gateway: "stripe", external_customer_id: "cus_external_456", created_at: now })
      .execute();

    await context.db
      .insertInto("billing_checkout_intents")
      .values({
        id: `${userId}-checkout-1`,
        user_id: userId,
        product_kind: "subscription",
        internal_ref: planId,
        currency: "USD",
        gateway: "stripe",
        status: "completed",
        external_session_id: "cs_external_789",
        created_at: now,
        completed_at: now
      })
      .execute();

    await context.db
      .insertInto("billing_operation_idempotency")
      .values({ operation_key: `reserve:${userId}:cycle-1`, result: JSON.stringify({ ok: true }) })
      .execute();

    return { subscriptionId, accountId };
  }

  it("delete: no retained billing column anywhere carries the original userId, while amounts/dates/plan survive", async () => {
    const userId = "acct-del-user-1";
    const otherUserId = "acct-del-user-2";
    await seedUserWithFullFootprint(userId, "auth0|acct-del-user-1");
    const { subscriptionId: otherSubscriptionId } = await seedUserWithFullFootprint(
      otherUserId,
      "auth0|acct-del-user-2"
    );

    const database = createPostgresDatabaseClient(context.db);
    const result = await Effect.runPromise(
      runAccountDeleteTransaction(database, userId, "auth0|acct-del-user-1", () => new Date())
    );

    // fix #1 — scan every candidate column, in every billing table, for the raw userId substring.
    for (const { table, column } of billingUserIdCandidateColumns()) {
      const rows = await context.db
        .selectFrom(table as any)
        .select(column as any)
        .where(column as any, "like", `%${userId}%`)
        .execute();
      expect(rows, `${table}.${column} must not contain the original userId`).toHaveLength(0);
    }

    const customerRows = await context.db
      .selectFrom("billing_gateway_customers")
      .selectAll()
      .where("user_id", "=", userId)
      .execute();
    expect(customerRows).toHaveLength(0); // external_customer_id dropped along with the row

    // financial values/dates/plan retained under the anonymized token.
    const subscriptionRow = await context.db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("id", "like", `${result.billingAnonymizationToken}:%`)
      .executeTakeFirst();
    expect(subscriptionRow).toBeDefined();
    expect(subscriptionRow?.plan_id).toBe("pro");
    expect(subscriptionRow?.status).toBe("active");
    expect(subscriptionRow?.user_id).toBe(result.billingAnonymizationToken);

    const ledgerRow = await context.db
      .selectFrom("billing_ledger_entries")
      .selectAll()
      .where("idempotency_key", "=", `${userId}-ledger-1`)
      .executeTakeFirst();
    expect(ledgerRow?.credits_delta).toBe(-1);
    expect(ledgerRow?.balance_after).toBe(9);

    const gatewaySubRow = await context.db
      .selectFrom("billing_gateway_subscriptions")
      .selectAll()
      .where("external_subscription_id", "=", "sub_external_123")
      .executeTakeFirst();
    expect(gatewaySubRow).toBeDefined();
    expect(gatewaySubRow?.subscription_id.startsWith(userId)).toBe(false);

    // isolation — user B's billing footprint (incl. subscription_id, which also embeds a userId
    // prefix) is completely untouched.
    const otherSubscriptionRow = await context.db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("id", "=", otherSubscriptionId)
      .executeTakeFirst();
    expect(otherSubscriptionRow?.user_id).toBe(otherUserId);

    // atomicity — voice/jobs/memories/execution_reactions/execution_idempotency hard-deleted,
    // tombstone set, id+externalSubject retained (no resurrection risk).
    expect(await context.db.selectFrom("jobs").selectAll().where("user_id", "=", userId).execute()).toHaveLength(0);
    expect(await context.db.selectFrom("memories").selectAll().where("user_id", "=", userId).execute()).toHaveLength(0);
    expect(
      await context.db.selectFrom("voice_examples").selectAll().where("user_id", "=", userId).execute()
    ).toHaveLength(0);
    expect(
      await context.db.selectFrom("execution_reactions").selectAll().where("user_id", "=", userId).execute()
    ).toHaveLength(0);

    const tombstoned = await context.db
      .selectFrom("application_users")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
    expect(tombstoned?.status).toBe("deleted");
    expect(tombstoned?.deleted_at).not.toBeNull();
    expect(tombstoned?.external_subject).toBe("auth0|acct-del-user-1");

    const outboxRow = await context.db
      .selectFrom("outbox_events")
      .selectAll()
      .where("aggregate_id", "=", userId)
      .where("event_type", "=", "account.auth0-delete")
      .executeTakeFirst();
    expect(outboxRow).toBeDefined();
  });

  it("reset: purges voice/history/memories/reactions, keeps the wallet, resets onboarding", async () => {
    const userId = "acct-reset-user-1";
    await seedUserWithFullFootprint(userId, "auth0|acct-reset-user-1");
    await context.db
      .updateTable("application_users")
      .set({ onboarding_completed_at: new Date().toISOString() })
      .where("id", "=", userId)
      .execute();

    const database = createPostgresDatabaseClient(context.db);
    await Effect.runPromise(runAccountResetTransaction(database, userId, () => new Date()));

    expect(await context.db.selectFrom("jobs").selectAll().where("user_id", "=", userId).execute()).toHaveLength(0);
    expect(await context.db.selectFrom("memories").selectAll().where("user_id", "=", userId).execute()).toHaveLength(0);
    expect(
      await context.db.selectFrom("voice_examples").selectAll().where("user_id", "=", userId).execute()
    ).toHaveLength(0);
    expect(
      await context.db.selectFrom("execution_reactions").selectAll().where("user_id", "=", userId).execute()
    ).toHaveLength(0);

    // granted lives inside the JSONB `data` column, not as a top-level table column — go through
    // the repository's own row parsing rather than reading raw columns.
    const consentRepo = createPostgresVoiceTrainingConsentRepository(context.db);
    const consent = await Effect.runPromise(consentRepo.getByUser(userId));
    expect(consent?.granted).toBe(false);

    const user = await context.db
      .selectFrom("application_users")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
    expect(user?.status).toBe("active"); // not tombstoned — reset survives.
    expect(user?.onboarding_completed_at).toBeNull();

    // wallet intact — billing untouched by reset.
    const subscriptionRow = await context.db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("user_id", "=", userId)
      .executeTakeFirst();
    expect(subscriptionRow).toBeDefined();
    expect(subscriptionRow?.status).toBe("active");
  });
});
