import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPostgresAuditRepository } from "../src/infra/postgres-repositories/postgres-audit-repository.js";
import {
  backendTestDatabaseUrl,
  clearAuditRecords,
  closePostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  openPostgresTestDatabase,
  type PostgresTestContext
} from "./postgres-test-helpers.js";

const describeIfPostgres = backendTestDatabaseUrl && await shouldRunPostgresIntegrationTests()
  ? describe
  : describe.skip;

describeIfPostgres("PostgreSQL Audit Repository", () => {
  let context: PostgresTestContext;

  beforeAll(async () => {
    context = await openPostgresTestDatabase();
  });

  afterAll(async () => {
    await closePostgresTestDatabase(context);
  });

  beforeEach(async () => {
    await clearAuditRecords(context.db);
  });

  it("persists and lists durable audit records", async () => {
    const repo = createPostgresAuditRepository(context.db);

    await Effect.runPromise(
      repo.putIfAbsent({
        id: "audit:1",
        logicalKey: "voice-example:example-1:created:2026-05-31T12:00:00.000Z",
        actorId: "user_1",
        actorType: "application_user",
        resourceType: "voice_example",
        resourceId: "example-1",
        mutationType: "voice_example.created",
        occurredAt: "2026-05-31T12:00:00.000Z",
        metadata: { pinned: true }
      })
    );

    const records = await Effect.runPromise(repo.list());
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      actorId: "user_1",
      resourceId: "example-1",
      mutationType: "voice_example.created"
    });
  });

  it("dedupes repeated logical mutations", async () => {
    const repo = createPostgresAuditRepository(context.db);
    const record = {
      id: "audit:dedupe-1",
      logicalKey: "job:job-1:completed:2026-05-31T12:05:00.000Z",
      actorId: "system",
      actorType: "system" as const,
      resourceType: "job",
      resourceId: "job-1",
      mutationType: "job.completed",
      occurredAt: "2026-05-31T12:05:00.000Z",
      metadata: { outputKeys: ["content"] }
    };

    await Effect.runPromise(repo.putIfAbsent(record));
    await Effect.runPromise(
      repo.putIfAbsent({
        ...record,
        id: "audit:dedupe-2",
        metadata: { outputKeys: ["content", "telemetry"] }
      })
    );

    const records = await Effect.runPromise(repo.list());
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe("audit:dedupe-1");
  });
});
