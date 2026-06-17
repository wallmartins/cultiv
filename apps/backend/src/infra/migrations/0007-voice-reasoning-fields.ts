import { sql } from "kysely";
import type { Kysely } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

/**
 * Author reasoning fields (Core Reasoning Signature, Format Expression Profile)
 * are stored inside voice_profiles.data JSONB — no relational columns required.
 * Rollback: remove optional fields from persisted JSON; existing rows remain valid.
 */
export async function up(_db: Kysely<DatabaseTables>): Promise<void> {
  await sql`SELECT 1`.execute(_db);
}

export async function down(_db: Kysely<DatabaseTables>): Promise<void> {
  await sql`SELECT 1`.execute(_db);
}
