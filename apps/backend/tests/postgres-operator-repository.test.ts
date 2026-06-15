import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createPostgresOperatorRepository } from "../src/infra/postgres-repositories/postgres-operator-repository.js";
import {
  backendTestDatabaseUrl,
  clearOperators,
  closePostgresTestDatabase,
  shouldRunPostgresIntegrationTests,
  openPostgresTestDatabase,
  type PostgresTestContext
} from "./postgres-test-helpers.js";

const describeIfPostgres = backendTestDatabaseUrl && await shouldRunPostgresIntegrationTests()
  ? describe
  : describe.skip;

describeIfPostgres("PostgreSQL Operator Repository", () => {
  let context: PostgresTestContext;

  beforeAll(async () => {
    context = await openPostgresTestDatabase();
  });

  afterAll(async () => {
    await closePostgresTestDatabase(context);
  });

  beforeEach(async () => {
    await clearOperators(context.db);
  });

  it("creates an operator and finds it by id", async () => {
    const repo = createPostgresOperatorRepository(context.db);
    const operator = await Effect.runPromise(
      repo.create({
        id: "op-1",
        permissions: ["ai_policy.activate"],
        roles: ["admin"],
        status: "active"
      })
    );

    expect(operator.id).toBe("op-1");
    expect(operator.permissions).toEqual(["ai_policy.activate"]);
    expect(operator.roles).toEqual(["admin"]);
    expect(operator.status).toBe("active");

    const found = await Effect.runPromise(repo.findById("op-1"));
    expect(found).toBeDefined();
    expect(found?.permissions).toEqual(["ai_policy.activate"]);
    expect(found?.roles).toEqual(["admin"]);
  });

  it("returns undefined when operator is not found", async () => {
    const repo = createPostgresOperatorRepository(context.db);
    await expect(Effect.runPromise(repo.findById("missing"))).resolves.toBeUndefined();
  });

  it("serializes permissions and roles as JSON", async () => {
    const repo = createPostgresOperatorRepository(context.db);
    await Effect.runPromise(
      repo.create({
        id: "op-json",
        permissions: ["a", "b"],
        roles: ["admin", "reviewer"],
        status: "active"
      })
    );

    const row = await context.db
      .selectFrom("operators")
      .where("id", "=", "op-json")
      .select(["permissions", "roles"])
      .executeTakeFirstOrThrow();

    expect(Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions)).toEqual(["a", "b"]);
    expect(Array.isArray(row.roles) ? row.roles : JSON.parse(row.roles)).toEqual(["admin", "reviewer"]);
  });
});
