import { Kysely } from "kysely";
import { resolveExecutionPresentation, type PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { JobRecord } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "../postgres-repositories/json-column.js";

function extractRuntimeRequest(record: JobRecord): PipelineRequest | undefined {
  const created = record.history.find((entry) => entry.type === "created");
  const payload = created?.payload;
  if (payload && typeof payload === "object" && "runtime" in payload) {
    return (payload as { runtime?: { request?: PipelineRequest } }).runtime?.request;
  }

  return undefined;
}

// ponytail: row-by-row (not a single bulk UPDATE) — briefingTopic requires the same JS-side
// derivation as the write path (presentation.ts), which isn't expressible as plain SQL.
export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  const rows = await db.selectFrom("jobs").select(["id", "data"]).execute();

  for (const row of rows) {
    const record = parseStoredJsonRecord<JobRecord>(row.data);
    const briefingTopic = resolveExecutionPresentation(
      extractRuntimeRequest(record),
      record.contentType
    ).briefingTopic;

    if (!briefingTopic) {
      continue;
    }

    await db
      .updateTable("jobs")
      .set({ data: JSON.stringify({ ...record, briefingTopic }) })
      .where("id", "=", row.id)
      .execute();
  }
}

export async function down(): Promise<void> {
  // no-op: briefingTopic is a denormalized read-optimization, not a source of truth to restore.
}
