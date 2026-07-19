import { Kysely, sql } from "kysely";
import type { DatabaseTables } from "../postgres-tables.js";

export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema
    .createTable("execution_reactions")
    .addColumn("execution_id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("user_id", "varchar(64)", (col) => col.notNull())
    .addColumn("reaction", "varchar(8)", (col) => col.notNull())
    .addColumn("reason", "text")
    .addColumn("created_at", "varchar(64)", (col) => col.notNull())
    .addColumn("updated_at", "varchar(64)", (col) => col.notNull())
    .addUniqueConstraint("execution_reactions_user_execution_unique", ["user_id", "execution_id"])
    .execute();

  await sql`alter table execution_reactions add constraint execution_reactions_value_chk check (reaction in ('up', 'down'))`.execute(
    db
  );
}

export async function down(db: Kysely<DatabaseTables>): Promise<void> {
  await db.schema.dropTable("execution_reactions").execute();
}
