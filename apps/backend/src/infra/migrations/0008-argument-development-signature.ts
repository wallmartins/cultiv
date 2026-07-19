import { sql } from "kysely";
import type { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(_db: Kysely<DatabaseTables>): Promise<void> {
  await sql`SELECT 1`.execute(_db);
}

export async function down(_db: Kysely<DatabaseTables>): Promise<void> {
  await sql`SELECT 1`.execute(_db);
}
