import { Kysely } from "kysely";
import type { JobRecord } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "../postgres-repositories/json-column.js";

function extractUserId(record: JobRecord): string | undefined {
  const created = record.history.find((entry) => entry.type === "created");
  const payload = created?.payload;
  if (payload && typeof payload === "object" && "runtime" in payload) {
    const runtime = (payload as { runtime?: { userId?: unknown } }).runtime;
    if (runtime && typeof runtime === "object" && typeof runtime.userId === "string") {
      return runtime.userId;
    }
  }

  return undefined;
}

// C3: userId is now a first-class Job field written to the user_id column atomically on create.
// Backfill the column for pre-existing rows whose owner only lived in history[0].payload.runtime.userId.
// Row-by-row (not one bulk UPDATE): the owner lives in nested JSON that isn't cleanly addressable as SQL.
export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  const rows = await db.selectFrom("jobs").select(["id", "user_id", "data"]).execute();

  for (const row of rows) {
    if (row.user_id) {
      continue;
    }

    const record = parseStoredJsonRecord<JobRecord>(row.data);
    const userId = extractUserId(record);
    if (!userId) {
      continue;
    }

    await db.updateTable("jobs").set({ user_id: userId }).where("id", "=", row.id).execute();
  }
}

export async function down(): Promise<void> {
  // no-op: user_id is a denormalized owner column backfilled from history, not a source of truth to restore.
}
