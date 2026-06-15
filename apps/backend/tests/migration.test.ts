import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import { validateSchema, expectedDatabaseTables, createSchemaValidationError } from "../src/infra/migration-runner.js";
import type { DatabaseTables } from "../src/infra/postgres-tables.js";

describe("Schema validation", () => {
  it("fails with schema_mismatch when tables are missing", async () => {
    const db = new Kysely<DatabaseTables>({
      dialect: {
        createAdapter: () => ({
          createIntrospector: () => ({
            getTables: async () => []
          })
        }),
        createDriver: () => ({}) as any,
        createQueryCompiler: () => ({}) as any,
        createIntrospector: () => ({
          getTables: async () => []
        })
      }
    });

    const result = await Effect.runPromise(
      validateSchema(db, expectedDatabaseTables).pipe(Effect.either)
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left.reason).toBe("schema_mismatch");
      expect(result.left.message).toContain("Missing tables");
    }
  });

  it("succeeds when all expected tables exist", async () => {
    const db = new Kysely<DatabaseTables>({
      dialect: {
        createAdapter: () => ({
          createIntrospector: () => ({
            getTables: async () =>
              expectedDatabaseTables.map((name) => ({ name, isView: false, schema: "public", columns: [] }))
          })
        }),
        createDriver: () => ({}) as any,
        createQueryCompiler: () => ({}) as any,
        createIntrospector: () => ({
          getTables: async () =>
            expectedDatabaseTables.map((name) => ({ name, isView: false, schema: "public", columns: [] }))
        })
      }
    });

    const result = await Effect.runPromise(
      validateSchema(db, expectedDatabaseTables).pipe(Effect.either)
    );

    expect(result._tag).toBe("Right");
  });
});

describe("createSchemaValidationError", () => {
  it("creates errors with correct structure", () => {
    const error = createSchemaValidationError("test", "connectivity");
    expect(error._tag).toBe("SchemaValidationError");
    expect(error.message).toBe("test");
    expect(error.reason).toBe("connectivity");
  });
});
