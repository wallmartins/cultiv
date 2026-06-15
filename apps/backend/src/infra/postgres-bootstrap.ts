import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import type { Pool, PoolConfig } from "pg";
import type { DatabaseTables } from "./postgres-tables.js";

export type PostgresDatabase = Kysely<DatabaseTables>;

export interface PostgresBootstrapError {
  readonly _tag: "PostgresBootstrapError";
  readonly message: string;
  readonly cause?: unknown;
}

export function createPostgresBootstrapError(
  message: string,
  cause?: unknown
): PostgresBootstrapError {
  return { _tag: "PostgresBootstrapError", message, cause };
}

export function createPostgresPoolConfig(databaseUrl: string): PoolConfig {
  return {
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };
}

export function acquirePostgresPool(
  databaseUrl: string
): Effect.Effect<Pool, PostgresBootstrapError> {
  return Effect.gen(function* () {
    if (!databaseUrl || databaseUrl.trim().length === 0) {
      return yield* Effect.fail(
        createPostgresBootstrapError("DATABASE_URL is empty")
      );
    }

    const { Pool: PgPool } = yield* Effect.tryPromise({
      try: () => import("pg"),
      catch: (e) =>
        createPostgresBootstrapError("Failed to import pg module", e)
    });

    const poolConfig = createPostgresPoolConfig(databaseUrl);
    const pool = new PgPool(poolConfig);

    yield* Effect.tryPromise({
      try: () => pool.query("SELECT 1"),
      catch: (e) =>
        createPostgresBootstrapError(
          "Failed to connect to PostgreSQL",
          e
        )
    });

    return pool;
  });
}

export function releasePostgresPool(pool: Pool): Effect.Effect<void> {
  return Effect.promise(() => pool.end());
}

export function bootstrapPostgresDatabase(
  databaseUrl: string
): Effect.Effect<PostgresDatabase, PostgresBootstrapError, never> {
  return Effect.gen(function* () {
    const pool = yield* acquirePostgresPool(databaseUrl);
    const dialect = new PostgresDialect({ pool });
    return new Kysely<DatabaseTables>({ dialect });
  });
}
