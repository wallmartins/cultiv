import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { AuditRecord, DatabaseClient } from "@my-ai-orchestrator/database";
import type { BackendRedactionService } from "../../safety/redaction-types.js";

export interface BackendAuditEventInput {
  readonly logicalKey: string;
  readonly actorId: string;
  readonly actorType: AuditRecord["actorType"];
  readonly resourceType: string;
  readonly resourceId: string;
  readonly mutationType: string;
  readonly occurredAt: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function persistBackendAuditEvent(
  database: DatabaseClient,
  event: BackendAuditEventInput,
  redaction?: BackendRedactionService
): Effect.Effect<AuditRecord, never> {
  const metadata = event.metadata && redaction
    ? redaction.redactObject(event.metadata as Record<string, unknown>).redacted
    : (event.metadata ?? {});

  return database.audit.putIfAbsent({
    id: buildAuditRecordId(event.logicalKey),
    logicalKey: event.logicalKey,
    actorId: event.actorId,
    actorType: event.actorType,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    mutationType: event.mutationType,
    occurredAt: event.occurredAt,
    metadata
  }).pipe(Effect.orDie);
}

function buildAuditRecordId(logicalKey: string): string {
  return `audit:${createHash("sha256").update(logicalKey).digest("hex").slice(0, 24)}`;
}
