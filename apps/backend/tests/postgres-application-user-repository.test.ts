import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPostgresApplicationUserRepository } from "../src/infra/postgres-repositories/postgres-application-user-repository.js";
import {
  backendTestDatabaseUrl,
  clearApplicationUsers,
  closePostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  openPostgresTestDatabase,
  type PostgresTestContext
} from "./postgres-test-helpers.js";

const describeIfPostgres = backendTestDatabaseUrl && await shouldRunPostgresIntegrationTests()
  ? describe
  : describe.skip;

describeIfPostgres("PostgreSQL Application User Repository", () => {
  let context: PostgresTestContext;

  beforeAll(async () => {
    context = await openPostgresTestDatabase();
  });

  afterAll(async () => {
    await closePostgresTestDatabase(context);
  });

  beforeEach(async () => {
    await clearApplicationUsers(context.db);
  });

  it("creates a user and finds it by id", async () => {
    const repo = createPostgresApplicationUserRepository(context.db);
    const createdAt = new Date("2026-05-31T12:00:00.000Z");
    const updatedAt = new Date("2026-05-31T12:05:00.000Z");

    const user = await Effect.runPromise(
      repo.create({
        id: "user-1",
        externalSubject: "auth0|123",
        status: "active",
        createdAt,
        updatedAt
      })
    );

    expect(user.id).toBe("user-1");
    expect(user.externalSubject).toBe("auth0|123");
    expect(user.createdAt.toISOString()).toBe(createdAt.toISOString());
    expect(user.updatedAt.toISOString()).toBe(updatedAt.toISOString());

    const found = await Effect.runPromise(repo.findById("user-1"));
    expect(found).toBeDefined();
    expect(found?.externalSubject).toBe("auth0|123");
    expect(found?.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it("finds a user by external subject", async () => {
    const repo = createPostgresApplicationUserRepository(context.db);
    await Effect.runPromise(
      repo.create({ id: "user-1", externalSubject: "auth0|123", status: "active" })
    );

    const found = await Effect.runPromise(repo.findByExternalSubject("auth0|123"));
    expect(found).toBeDefined();
    expect(found?.id).toBe("user-1");
  });

  it("returns undefined when user is not found", async () => {
    const repo = createPostgresApplicationUserRepository(context.db);

    await expect(Effect.runPromise(repo.findById("missing"))).resolves.toBeUndefined();
    await expect(
      Effect.runPromise(repo.findByExternalSubject("auth0|missing"))
    ).resolves.toBeUndefined();
  });

  it("enforces a unique external subject", async () => {
    const repo = createPostgresApplicationUserRepository(context.db);
    await Effect.runPromise(
      repo.create({ id: "user-1", externalSubject: "auth0|dup", status: "active" })
    );

    await expect(
      Effect.runPromise(
        repo.create({ id: "user-2", externalSubject: "auth0|dup", status: "active" })
      )
    ).rejects.toThrow();
  });

  it("persists records across reopened connections", async () => {
    const repo = createPostgresApplicationUserRepository(context.db);
    await Effect.runPromise(
      repo.create({ id: "user-persisted", externalSubject: "auth0|persisted", status: "active" })
    );

    await closePostgresTestDatabase(context);
    context = await openPostgresTestDatabase();

    const reopenedRepo = createPostgresApplicationUserRepository(context.db);
    const found = await Effect.runPromise(reopenedRepo.findById("user-persisted"));

    expect(found).toBeDefined();
    expect(found?.externalSubject).toBe("auth0|persisted");
  });
});
