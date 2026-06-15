import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient, VoiceExampleBatchRecord } from "@my-ai-orchestrator/database";
import type { ReasonCode } from "@my-ai-orchestrator/contracts";
import {
  VoiceBatchExpiredError,
  VoiceBatchNotFoundError,
  type VoiceExample,
  type VoiceExampleDraft
} from "@my-ai-orchestrator/domain";
import { persistBackendAuditEvent } from "../core/audit-trail.js";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import {
  buildExampleId,
  buildInitialEvaluation,
  enforcePinnedLimits,
  normalizeOptional,
  resolveContentTypeHints,
  resolveTargetProfileVersion,
  toVoiceExampleDraft
} from "./voice-shared.js";
import { toVoiceExampleBatchCommitResultView } from "./voice-mappers.js";
import type { VoiceExampleBatchInput } from "./voice-types.js";

export function buildBatchId(userId: string, epochMs: number): string {
  return `voice-batch:${userId}:${epochMs}`;
}

export function buildBatchItemResult(
  batchId: string,
  item: VoiceExampleBatchInput,
  index: number,
  existingClientItemIds: Set<string>
): { readonly id: string; readonly batchId: string; readonly clientItemId: string; readonly accepted: boolean; readonly reasonCode?: ReasonCode; readonly message?: string; readonly stagedInput?: VoiceExampleDraft; readonly createdAt: string } {
  if (existingClientItemIds.has(item.clientItemId)) {
    return {
      id: `${batchId}:item:${index + 1}`,
      batchId,
      clientItemId: item.clientItemId,
      accepted: false,
      reasonCode: "invalid_example_payload",
      message: "Duplicate clientItemId in batch",
      createdAt: new Date().toISOString()
    };
  }

  existingClientItemIds.add(item.clientItemId);

  if (item.input.text.trim().length === 0) {
    return {
      id: `${batchId}:item:${index + 1}`,
      batchId,
      clientItemId: item.clientItemId,
      accepted: false,
      reasonCode: "invalid_example_payload",
      message: "Voice example text cannot be empty",
      createdAt: new Date().toISOString()
    };
  }

  return {
    id: `${batchId}:item:${index + 1}`,
    batchId,
    clientItemId: item.clientItemId,
    accepted: true,
    stagedInput: toVoiceExampleDraft(item.input),
    createdAt: new Date().toISOString()
  };
}

export function requireOpenBatch(
  database: DatabaseClient,
  userId: string,
  batchId: string,
  now: () => Date
) {
  return Effect.gen(function* () {
    const batch = yield* database.voiceExampleBatches.get(batchId);
    if (!batch || batch.userId !== userId) {
      return yield* Effect.fail(new VoiceBatchNotFoundError({ batchId }));
    }

    if (batch.status !== "open" || batch.expiresAt <= now().toISOString()) {
      return yield* Effect.fail(
        new VoiceBatchExpiredError({
          batchId,
          expiredAt: batch.expiresAt
        })
      );
    }

    return batch;
  });
}

export function commitAcceptedBatchItems(
  database: DatabaseClient,
  userId: string,
  batch: { readonly items: readonly { readonly accepted: boolean; readonly stagedInput?: VoiceExampleDraft | undefined; readonly clientItemId: string }[] },
  targetProfileVersion: number,
  now: () => Date
) {
  return Effect.gen(function* () {
    const existing = yield* database.voiceExamples.listByUser(userId);
    let nextExamples = existing;
    const created: Array<{ clientItemId: string; exampleId: string }> = [];

    for (const item of batch.items) {
      if (!item.accepted || !item.stagedInput) {
        continue;
      }

      yield* enforcePinnedLimits(
        nextExamples,
        userId,
        item.stagedInput.pinned ?? false,
        item.stagedInput.explicitContentType
      );

      const example = buildVoiceExampleFromInput(
        userId,
        item.stagedInput,
        nextExamples.length + 1,
        targetProfileVersion,
        now
      );
      const stored = yield* database.voiceExamples.create(example).pipe(Effect.orDie);
      nextExamples = [...nextExamples, stored];
      created.push({
        clientItemId: item.clientItemId,
        exampleId: stored.id
      });
    }

    return created;
  });
}

export function buildVoiceExampleFromInput(
  userId: string,
  input: VoiceExampleDraft,
  nextIndex: number,
  targetProfileVersion: number,
  now: () => Date
): VoiceExample {
  const timestamp = now().toISOString();
  return {
    id: buildExampleId(userId, nextIndex),
    userId,
    text: input.text.trim(),
    language: input.language?.trim() || "pt-BR",
    channel: normalizeOptional(input.channel),
    format: normalizeOptional(input.format),
    explicitContentType: normalizeOptional(input.explicitContentType),
    context: normalizeOptional(input.context),
    state: "active",
    classificationLabels: input.userLabels?.length ? [...input.userLabels] : ["positive"],
    antiPatternsExplicit: input.antiPatternsExplicit ? [...input.antiPatternsExplicit] : [],
    pinned: input.pinned ?? false,
    pendingProfileImpact: true,
    targetProfileVersion,
    effectiveContentTypeHints: resolveContentTypeHints(input.explicitContentType, input.channel),
    evaluation: buildInitialEvaluation({
      text: input.text,
      explicitContentType: input.explicitContentType,
      channel: input.channel,
      pinned: input.pinned ?? false
    }),
    performance: input.performance
      ? {
          channel: normalizeOptional(input.performance.channel),
          publishedAt: normalizeOptional(input.performance.publishedAt),
          selfRating: input.performance.selfRating,
          likes: input.performance.likes,
          comments: input.performance.comments
        }
      : undefined,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function commitExpiredBatch(
  database: DatabaseClient,
  batch: VoiceExampleBatchRecord,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService
) {
  return Effect.gen(function* () {
    if (voiceConsent) {
      yield* voiceConsent.assertConsent(batch.userId);
    }

    const { createdExamples, saved } = yield* database.transaction((trxDatabase) =>
      Effect.gen(function* () {
        const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, batch.userId);
        const createdExamples = yield* commitAcceptedBatchItems(trxDatabase, batch.userId, batch, targetProfileVersion, now);
        const itemsByClientId = new Map(createdExamples.map((item) => [item.clientItemId, item.exampleId] as const));
        const committedAt = now().toISOString();

        const status = batch.expiresAt <= committedAt ? "expired" : "committed";
        const saved = yield* trxDatabase.voiceExampleBatches.save({
          ...batch,
          status,
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
        }).pipe(Effect.orDie);
        yield* persistBackendAuditEvent(trxDatabase, {
          logicalKey: `voice-batch:${saved.id}:auto-committed:${saved.committedAt ?? saved.updatedAt}`,
          actorId: "system",
          actorType: "system",
          resourceType: "voice_example_batch",
          resourceId: saved.id,
          mutationType: "voice_batch.auto_committed",
          occurredAt: saved.committedAt ?? saved.updatedAt,
          metadata: {
            createdExamples: createdExamples.length,
            acceptedItems: saved.acceptedItems,
            rejectedItems: saved.rejectedItems,
            status: saved.status,
            targetProfileVersion: saved.targetProfileVersion ?? null
          }
        });
        return { createdExamples, saved };
      })
    ).pipe(
      Effect.catchTag("DatabaseTransactionInvariantError", (error) => Effect.die(error))
    );

    yield* observability.recordVoiceBatchCommitted({
      userId: batch.userId,
      batchId: saved.id,
      createdExamples: createdExamples.length,
      acceptedItems: saved.acceptedItems,
      expired: true
    });
    logger?.info("Auto-committed expired voice batch", {
      userId: batch.userId,
      batchId: saved.id,
      createdExamples: createdExamples.length,
      expired: true
    });

    return toVoiceExampleBatchCommitResultView(saved);
  });
}

export function listAllVoiceBatches(database: DatabaseClient) {
  return Effect.sync(() => Object.values(database.snapshot().voiceExampleBatches));
}
