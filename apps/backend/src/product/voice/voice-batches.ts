import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import {
  VoiceExampleBatch
} from "@my-ai-orchestrator/domain";
import type {
  BackendVoiceService,
  VoiceExampleBatchInput
} from "./voice-types.js";
import { persistBackendAuditEvent } from "../core/audit-trail.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import { resolveTargetProfileVersion } from "./voice-shared.js";
import {
  toVoiceExampleBatchCommitResultView,
  toVoiceExampleBatchView
} from "./voice-mappers.js";
import {
  buildBatchId,
  buildBatchItemResult,
  commitAcceptedBatchItems,
  commitExpiredBatch,
  listAllVoiceBatches,
  requireOpenBatch
} from "./voice-batch-helpers.js";

export function createVoiceBatchOperations(
  database: DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService
): Pick<
  BackendVoiceService,
  "createBatch" | "addBatchItems" | "commitBatch" | "autoCommitExpiredBatches"
> {
  return {
    createBatch(userId, options = {}) {
      return Effect.gen(function* () {
        const instant = now();
        const timestamp = instant.toISOString();
        const batch: VoiceExampleBatch = {
          id: buildBatchId(userId, instant.getTime()),
          userId,
          status: "open",
          expiresAt: options.expiresAt ?? new Date(now().getTime() + 30 * 60 * 1000).toISOString(),
          acceptedItems: 0,
          rejectedItems: 0,
          items: [],
          createdAt: timestamp,
          updatedAt: timestamp
        };

        const created = yield* database.voiceExampleBatches.create(batch).pipe(Effect.orDie);
        return toVoiceExampleBatchView(created);
      });
    },
    addBatchItems(userId, batchId, items) {
      return Effect.gen(function* () {
        const batch = yield* requireOpenBatch(database, userId, batchId, now);
        const existingClientItemIds = new Set(batch.items.map((item) => item.clientItemId));
        const additions = items.map((item, index) =>
          buildBatchItemResult(batch.id, item, index, existingClientItemIds)
        );
        const nextBatch: VoiceExampleBatch = {
          ...batch,
          acceptedItems: batch.acceptedItems + additions.filter((item) => item.accepted).length,
          rejectedItems: batch.rejectedItems + additions.filter((item) => !item.accepted).length,
          items: [...batch.items, ...additions],
          updatedAt: now().toISOString()
        };

        const saved = yield* database.voiceExampleBatches.save({
          ...nextBatch,
          version: batch.version
        }).pipe(Effect.orDie);

        return toVoiceExampleBatchView(saved);
      });
    },
    commitBatch(userId, batchId) {
      return Effect.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }

        const { createdExamples, saved } = yield* database.transaction((trxDatabase) =>
          Effect.gen(function* () {
            const batch = yield* requireOpenBatch(trxDatabase, userId, batchId, now);
            const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, userId);
            const createdExamples = yield* commitAcceptedBatchItems(trxDatabase, userId, batch, targetProfileVersion, now);
            const itemsByClientId = new Map(createdExamples.map((item) => [item.clientItemId, item.exampleId] as const));
            const committedAt = now().toISOString();

            const committedBatch: VoiceExampleBatch = {
              ...batch,
              status: "committed",
              committedAt,
              targetProfileVersion,
              updatedAt: committedAt,
              items: batch.items.map((item) =>
                item.accepted
                  ? {
                      ...item,
                      exampleId: itemsByClientId.get(item.clientItemId) ?? item.exampleId
                    }
                  : item
              )
            };

            const saved = yield* trxDatabase.voiceExampleBatches.save({
              ...committedBatch,
              version: batch.version
            }).pipe(Effect.orDie);
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `voice-batch:${saved.id}:committed:${saved.committedAt ?? saved.updatedAt}`,
              actorId: userId,
              actorType: "application_user",
              resourceType: "voice_example_batch",
              resourceId: saved.id,
              mutationType: "voice_batch.committed",
              occurredAt: saved.committedAt ?? saved.updatedAt,
              metadata: {
                createdExamples: createdExamples.length,
                acceptedItems: saved.acceptedItems,
                rejectedItems: saved.rejectedItems,
                targetProfileVersion: saved.targetProfileVersion ?? null
              }
            });
            return { createdExamples, saved };
          })
        ).pipe(
          Effect.catchTag("DatabaseTransactionInvariantError", (error) => Effect.die(error))
        );

        if (createdExamples.length > 0) {
          yield* voiceRebuild.schedule(userId);
        }

        yield* observability.recordVoiceBatchCommitted({
          userId,
          batchId: saved.id,
          createdExamples: createdExamples.length,
          acceptedItems: saved.acceptedItems
        });
        logger?.info("Committed voice example batch", {
          userId,
          batchId: saved.id,
          createdExamples: createdExamples.length,
          acceptedItems: saved.acceptedItems
        });

        return toVoiceExampleBatchCommitResultView(saved);
      });
    },
    autoCommitExpiredBatches(userId) {
      return Effect.gen(function* () {
        if (voiceConsent && userId) {
          yield* voiceConsent.assertConsent(userId);
        }

        const batches = userId
          ? yield* database.voiceExampleBatches.listByUser(userId)
          : yield* listAllVoiceBatches(database);

        const expired = batches.filter(
          (batch) => batch.status === "open" && batch.expiresAt <= now().toISOString()
        );

        const committed = yield* Effect.forEach(
          expired,
          (batch) => commitExpiredBatch(database, batch, now, observability, logger, voiceConsent),
          { concurrency: 1 }
        );

        const affectedUsers = unique(
          expired
            .filter((batch) => batch.items.some((item) => item.accepted && item.stagedInput))
            .map((batch) => batch.userId)
        );
        yield* Effect.forEach(affectedUsers, (affectedUserId) => voiceRebuild.schedule(affectedUserId), {
          concurrency: 1,
          discard: true
        });

        return committed;
      });
    }
  };
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
