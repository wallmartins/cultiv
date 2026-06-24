import { Effect } from "effect";
import { Kysely } from "kysely";
import type { PipelineRecord, PipelineRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";
import { parseStoredJsonRecord } from "./json-column.js";
import { postgresTryPromise } from "./postgres-try-promise.js";

function toRow(record: PipelineRecord) {
  return {
    id: record.id,
    data: JSON.stringify(record),
    version: record.version,
    updated_at: record.updatedAt
  };
}

function parseRow(row: { id: string; data: unknown; version: number; updated_at: string }): PipelineRecord {
  return {
    ...parseStoredJsonRecord<PipelineRecord>(row.data),
    version: row.version,
    updatedAt: row.updated_at
  };
}

export function createPostgresPipelineRepository(
  db: Kysely<DatabaseTables>
): PipelineRepository {
  return {
    put(record, version = 1, updatedAt = new Date().toISOString()) {
      return Effect.gen(function* () {
        const next = { ...record, version, updatedAt };

        yield* postgresTryPromise("pipelines.put", () =>
          db.insertInto("pipelines")
            .values(toRow(next))
            .onConflict((oc) => oc.column("id").doUpdateSet(toRow(next)))
            .execute()
        );

        return next;
      });
    },

    get(id) {
      return Effect.gen(function* () {
        const row = yield* postgresTryPromise("pipelines.get", () =>
          db.selectFrom("pipelines")
            .where("id", "=", id)
            .selectAll()
            .executeTakeFirst()
        );

        return row ? parseRow(row) : undefined;
      });
    },

    list() {
      return Effect.gen(function* () {
        const rows = yield* postgresTryPromise("pipelines.list", () =>
          db.selectFrom("pipelines").selectAll().execute()
        );

        return rows.map(parseRow);
      });
    }
  };
}
