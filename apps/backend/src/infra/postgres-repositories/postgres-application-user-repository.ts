import { Effect } from "effect";
import { Kysely } from "kysely";
import type {
  BackendApplicationUser,
  BackendApplicationUserRepository
} from "../../auth/application-user.js";
import type { DatabaseTables } from "../postgres-tables.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

type ApplicationUserRow = {
  id: string;
  external_subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function parseApplicationUser(row: ApplicationUserRow): BackendApplicationUser {
  return {
    id: row.id,
    externalSubject: row.external_subject,
    status: row.status as BackendApplicationUser["status"],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

export function createPostgresApplicationUserRepository(
  db: Kysely<DatabaseTables>
): BackendApplicationUserRepository {
  return {
    findByExternalSubject(externalSubject) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("application_users.findByExternalSubject", () =>
          db.selectFrom("application_users")
            .where("external_subject", "=", externalSubject)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseApplicationUser(row) : undefined;
      });
    },

    create(args) {
      return Effect.gen(function* () {
        const createdAt = args.createdAt ?? new Date();
        const updatedAt = args.updatedAt ?? createdAt;
        const row: ApplicationUserRow = {
          id: args.id,
          external_subject: args.externalSubject,
          status: args.status ?? "active",
          created_at: createdAt.toISOString(),
          updated_at: updatedAt.toISOString()
        };

        yield* postgresTryPromise("application_users.create", () =>
          db.insertInto("application_users").values(row).execute()
        );

        return parseApplicationUser(row);
      });
    },

    findById(id) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("application_users.findById", () =>
          db.selectFrom("application_users")
            .where("id", "=", id)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseApplicationUser(row) : undefined;
      });
    }
  };
}
