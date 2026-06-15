import { Effect } from "effect";
import { Kysely } from "kysely";
import type { BackendOperator, BackendOperatorRepository } from "../../auth/operator.js";
import type { DatabaseTables } from "../postgres-tables.js";

type OperatorRow = {
  id: string;
  permissions: string | readonly string[];
  roles: string | readonly string[];
  status: string;
  created_at: string;
  updated_at: string;
};

function parseJsonArray(value: string | readonly string[]): readonly string[] {
  if (typeof value !== "string") {
    return [...value];
  }

  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseOperator(row: OperatorRow): BackendOperator {
  return {
    id: row.id,
    permissions: parseJsonArray(row.permissions),
    roles: parseJsonArray(row.roles),
    status: row.status as BackendOperator["status"]
  };
}

export function createPostgresOperatorRepository(
  db: Kysely<DatabaseTables>
): BackendOperatorRepository {
  return {
    findById(id) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("operators")
              .where("id", "=", id)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseOperator(row) : undefined;
      }).pipe(Effect.orDie);
    },

    create(args) {
      return Effect.gen(function* () {
        const now = new Date().toISOString();
        const operator: BackendOperator = {
          id: args.id,
          permissions: args.permissions ?? [],
          roles: args.roles ?? [],
          status: args.status ?? "active"
        };

        yield* Effect.tryPromise({
          try: () =>
            db.insertInto("operators")
              .values({
                id: operator.id,
                permissions: JSON.stringify(operator.permissions),
                roles: JSON.stringify(operator.roles),
                status: operator.status,
                created_at: now,
                updated_at: now
              })
              .execute(),
          catch: (error) => error
        }).pipe(Effect.orDie);

        return operator;
      }).pipe(Effect.orDie);
    }
  };
}
