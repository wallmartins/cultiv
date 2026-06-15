import { Effect } from "effect";
import { Kysely } from "kysely";
import type { AuditRecord, AuditRepository } from "@my-ai-orchestrator/database";
import type { DatabaseTables } from "../postgres-tables.js";

type AuditRecordRow = {
  id: string;
  logical_key: string;
  actor_id: string;
  actor_type: string;
  resource_type: string;
  resource_id: string;
  mutation_type: string;
  occurred_at: string;
  metadata: string | Record<string, unknown>;
};

type AuditRecordInsertRow = Omit<AuditRecordRow, "metadata"> & {
  metadata: string;
};

function parseMetadata(value: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof value !== "string") {
    return { ...value };
  }

  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? { ...(parsed as Record<string, unknown>) }
    : {};
}

function parseRow(row: AuditRecordRow): AuditRecord {
  return {
    id: row.id,
    logicalKey: row.logical_key,
    actorId: row.actor_id,
    actorType: row.actor_type as AuditRecord["actorType"],
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    mutationType: row.mutation_type,
    occurredAt: row.occurred_at,
    metadata: parseMetadata(row.metadata)
  };
}

function toRow(record: AuditRecord): AuditRecordInsertRow {
  return {
    id: record.id,
    logical_key: record.logicalKey,
    actor_id: record.actorId,
    actor_type: record.actorType,
    resource_type: record.resourceType,
    resource_id: record.resourceId,
    mutation_type: record.mutationType,
    occurred_at: record.occurredAt,
    metadata: JSON.stringify(record.metadata)
  };
}

export function createPostgresAuditRepository(
  db: Kysely<DatabaseTables>
): AuditRepository {
  return {
    putIfAbsent(record) {
      return Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("audit_records")
              .where("logical_key", "=", record.logicalKey)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        if (existing) {
          return parseRow(existing);
        }

        const row = toRow(record);
        yield* Effect.tryPromise({
          try: () =>
            db.insertInto("audit_records")
              .values(row)
              .onConflict((conflict) => conflict.column("logical_key").doNothing())
              .execute(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        const stored = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("audit_records")
              .where("logical_key", "=", record.logicalKey)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return stored ? parseRow(stored) : record;
      }).pipe(Effect.orDie);
    },
    getByLogicalKey(logicalKey) {
      return Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("audit_records")
              .where("logical_key", "=", logicalKey)
              .selectAll()
              .executeTakeFirst(),
          catch: () => undefined
        }).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return row ? parseRow(row) : undefined;
      }).pipe(Effect.orDie);
    },
    list() {
      return Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            db.selectFrom("audit_records")
              .selectAll()
              .orderBy("occurred_at", "asc")
              .execute(),
          catch: () => [] as AuditRecordRow[]
        }).pipe(Effect.catchAll(() => Effect.succeed([])));

        return rows.map(parseRow);
      }).pipe(Effect.orDie);
    }
  };
}
