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

// A 0020 desnormalizou só `briefingTopic`, mas applyJobListFilters passou a filtrar também por
// `generationIntent` e `lengthTier` — sem backfill, esses filtros não encontrariam nenhuma linha
// antiga. Aqui grava a presentation inteira, mesmo derivador do caminho de escrita.
//
// ponytail: row-by-row (não um UPDATE em bloco) — a derivação vive em presentation.ts e não é
// expressável em SQL puro. Mesmo trade-off assumido na 0020.
export async function up(db: Kysely<DatabaseTables>): Promise<void> {
  const rows = await db.selectFrom("jobs").select(["id", "data"]).execute();

  for (const row of rows) {
    const record = parseStoredJsonRecord<JobRecord>(row.data);
    const presentation = resolveExecutionPresentation(extractRuntimeRequest(record), record.contentType);

    if (Object.keys(presentation).length === 0) {
      continue;
    }

    await db
      .updateTable("jobs")
      .set({ data: JSON.stringify({ ...record, ...presentation }) })
      .where("id", "=", row.id)
      .execute();
  }
}

export async function down(): Promise<void> {
  // no-op: a presentation é read-optimization desnormalizada, não fonte de verdade a restaurar.
}
