import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import { getPostgresDatabase } from "../../infra/postgres-client.js";
import { insertOutboxEvent } from "../../infra/durable-store.js";
import { anonymizeBillingForUser } from "../../infra/billing/postgres-billing-anonymization.js";
import { revokeVoiceTrainingConsent } from "../../safety/voice-consent-revocation.js";
import { persistBackendAuditEvent } from "../core/audit-trail.js";

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

// contract-08 §2 — reset's storage mutation, run inside ONE Postgres transaction (database.transaction
// already wraps a real `db.transaction().execute(...)`, see infra/postgres-client.ts). Reuses
// revokeVoiceTrainingConsent wholesale — reset's "voice complete + consent -> not-granted" IS that
// operation, not a reimplementation of it.
export function runAccountResetTransaction(
  database: DatabaseClient,
  userId: string,
  now: () => Date
): Effect.Effect<void, Error> {
  return database
    .transaction((trxClient) =>
      Effect.gen(function* () {
        const trxDb = getPostgresDatabase(trxClient);
        if (!trxDb) {
          return yield* Effect.fail(new Error("Account reset requires PostgreSQL"));
        }

        yield* revokeVoiceTrainingConsent(userId, { database: trxClient, now }).pipe(Effect.mapError(toError));
        yield* trxClient.jobs.removeByUser(userId).pipe(Effect.mapError(toError));
        yield* trxClient.memories.removeByUser(userId).pipe(Effect.mapError(toError));
        yield* trxClient.executionReactions.removeByUser(userId).pipe(Effect.mapError(toError));

        yield* Effect.tryPromise({
          try: () => trxDb.deleteFrom("execution_idempotency").where("user_id", "=", userId).execute(),
          catch: toError
        });

        const nowIso = now().toISOString();
        yield* Effect.tryPromise({
          try: () =>
            trxDb
              .updateTable("application_users")
              .set({ onboarding_completed_at: null, updated_at: nowIso })
              .where("id", "=", userId)
              .execute(),
          catch: toError
        });

        yield* persistBackendAuditEvent(trxClient, {
          logicalKey: `account:${userId}:reset:${nowIso}`,
          actorId: userId,
          actorType: "application_user",
          resourceType: "application_user",
          resourceId: userId,
          mutationType: "account.reset",
          occurredAt: nowIso,
          metadata: {}
        });
      })
    )
    .pipe(Effect.mapError(toError));
}

export interface AccountDeleteTransactionResult {
  readonly billingAnonymizationToken: string;
}

// contract-08 §3 steps 5-7 — the single local transaction: hard-delete voice/jobs/memories/
// execution_idempotency, anonymize billing (the one sanctioned append-only mutation), tombstone,
// audit, and enqueue the Auth0 delete atomically with everything else (outbox pattern — the event
// row can never be lost even if the process dies right after commit; the actual Auth0 call is async,
// via the outbox relay, because it can't join this local transaction).
export function runAccountDeleteTransaction(
  database: DatabaseClient,
  userId: string,
  externalSubject: string,
  now: () => Date
): Effect.Effect<AccountDeleteTransactionResult, Error> {
  return database
    .transaction((trxClient) =>
      Effect.gen(function* () {
        const trxDb = getPostgresDatabase(trxClient);
        if (!trxDb) {
          return yield* Effect.fail(new Error("Account delete requires PostgreSQL"));
        }

        // reused wholesale from reset (same primitive) — also marks voice_training_consents
        // revoked, not just hard-deleting the artifacts, for consistency with reset's own purge.
        yield* revokeVoiceTrainingConsent(userId, { database: trxClient, now }).pipe(Effect.mapError(toError));
        yield* trxClient.jobs.removeByUser(userId).pipe(Effect.mapError(toError));
        yield* trxClient.memories.removeByUser(userId).pipe(Effect.mapError(toError));
        yield* trxClient.executionReactions.removeByUser(userId).pipe(Effect.mapError(toError));

        yield* Effect.tryPromise({
          try: () => trxDb.deleteFrom("execution_idempotency").where("user_id", "=", userId).execute(),
          catch: toError
        });

        const { token } = yield* anonymizeBillingForUser(trxDb, userId).pipe(Effect.mapError(toError));

        const deletedAtIso = now().toISOString();
        yield* Effect.tryPromise({
          try: () =>
            trxDb
              .updateTable("application_users")
              .set({ status: "deleted", deleted_at: deletedAtIso, updated_at: deletedAtIso })
              .where("id", "=", userId)
              .execute(),
          catch: toError
        });

        yield* persistBackendAuditEvent(trxClient, {
          logicalKey: `account:${userId}:deleted:${deletedAtIso}`,
          actorId: userId,
          actorType: "application_user",
          resourceType: "application_user",
          resourceId: userId,
          mutationType: "account.deleted",
          occurredAt: deletedAtIso,
          metadata: { billingAnonymizationToken: token }
        });

        yield* insertOutboxEvent(trxDb, {
          id: randomUUID(),
          aggregateType: "application_user",
          aggregateId: userId,
          eventType: "account.auth0-delete",
          payload: { externalSubject },
          occurredAt: deletedAtIso
        }).pipe(Effect.mapError(toError));

        return { billingAnonymizationToken: token };
      })
    )
    .pipe(Effect.mapError(toError));
}
