import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  VoiceExampleValidationError,
  type VoiceExample
} from "@my-ai-orchestrator/domain";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BackendVoiceService } from "./voice-types.js";
import { persistBackendAuditEvent } from "../core/audit-trail.js";
import {
  buildExampleId,
  buildInitialEvaluation,
  enforcePinnedLimits,
  normalizeOptional,
  resolveContentTypeHints,
  resolveTargetProfileVersion,
  validateVoiceExampleInput
} from "./voice-shared.js";
import { toVoiceExampleListItemView } from "./voice-mappers.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";

export function createVoiceLifecycleMutationOperations(
  database: import("@my-ai-orchestrator/database").DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  now: () => Date,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService
): Pick<BackendVoiceService, "createExample" | "updateExample"> {
  return {
    createExample(userId, input) {
      return Effect.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }

        const created = yield* database.transaction((trxDatabase) =>
          Effect.gen(function* () {
            yield* validateVoiceExampleInput(input);

            const existing = yield* trxDatabase.voiceExamples.listByUser(userId);
            const pinned = input.pinned ?? false;
            yield* enforcePinnedLimits(existing, userId, pinned, input.explicitContentType);

            const timestamp = now().toISOString();
            const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, userId);
            const example: VoiceExample = {
              id: buildExampleId(userId, existing.length + 1),
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
              pinned,
              pendingProfileImpact: true,
              targetProfileVersion,
              effectiveContentTypeHints: resolveContentTypeHints(input.explicitContentType, input.channel),
              evaluation: buildInitialEvaluation({
                text: input.text,
                explicitContentType: input.explicitContentType,
                channel: input.channel,
                pinned
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

            const stored = yield* trxDatabase.voiceExamples.create(example).pipe(Effect.orDie);
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `voice-example:${stored.id}:created:${stored.createdAt}`,
              actorId: userId,
              actorType: "application_user",
              resourceType: "voice_example",
              resourceId: stored.id,
              mutationType: "voice_example.created",
              occurredAt: stored.createdAt,
              metadata: {
                explicitContentType: stored.explicitContentType ?? null,
                pinned: stored.pinned,
                targetProfileVersion: stored.targetProfileVersion
              }
            });
            return stored;
          })
        ).pipe(
          Effect.catchTag("DatabaseTransactionInvariantError", (error) => Effect.die(error))
        );
        logger?.info("Stored voice example", {
          userId,
          exampleId: created.id,
          pinned: created.pinned
        });
        yield* voiceRebuild.schedule(userId);
        return toVoiceExampleListItemView(created, created.version);
      });
    },
    updateExample(userId, exampleId, input) {
      return Effect.gen(function* () {
        if (voiceConsent) {
          yield* voiceConsent.assertConsent(userId);
        }

        const updatedRecord = yield* database.transaction((trxDatabase) =>
          Effect.gen(function* () {
            const current = yield* trxDatabase.voiceExamples.get(exampleId);
            if (!current || current.userId !== userId) {
              return undefined;
            }

            if (input.text !== undefined && input.text.trim().length === 0) {
              return yield* Effect.fail(
                new VoiceExampleValidationError({
                  reasonCode: "invalid_example_payload",
                  field: "text",
                  message: "Voice example text cannot be empty"
                })
              );
            }

            const allExamples = yield* trxDatabase.voiceExamples.listByUser(userId);
            const nextPinned = input.pinned ?? current.pinned;
            yield* enforcePinnedLimits(
              allExamples.filter((example) => example.id !== current.id),
              userId,
              nextPinned,
              input.explicitContentType ?? current.explicitContentType
            );

            const targetProfileVersion = yield* resolveTargetProfileVersion(trxDatabase, userId);
            const updatedDomain: VoiceExample = {
              ...current,
              text: input.text?.trim() ?? current.text,
              language: input.language?.trim() ?? current.language,
              channel: input.channel !== undefined ? normalizeOptional(input.channel) : current.channel,
              format: input.format !== undefined ? normalizeOptional(input.format) : current.format,
              explicitContentType:
                input.explicitContentType !== undefined
                  ? normalizeOptional(input.explicitContentType)
                  : current.explicitContentType,
              context: input.context !== undefined ? normalizeOptional(input.context) : current.context,
              antiPatternsExplicit:
                input.antiPatternsExplicit !== undefined
                  ? [...input.antiPatternsExplicit]
                  : current.antiPatternsExplicit,
              classificationLabels:
                input.userLabels !== undefined && input.userLabels.length > 0
                  ? [...input.userLabels]
                  : current.classificationLabels,
              pinned: nextPinned,
              state: input.state ?? current.state,
              pendingProfileImpact: true,
              targetProfileVersion,
              effectiveContentTypeHints:
                input.explicitContentType !== undefined || input.channel !== undefined
                  ? resolveContentTypeHints(input.explicitContentType ?? current.explicitContentType, input.channel ?? current.channel)
                  : current.effectiveContentTypeHints,
              evaluation: buildInitialEvaluation({
                text: input.text ?? current.text,
                explicitContentType: input.explicitContentType ?? current.explicitContentType,
                channel: input.channel ?? current.channel,
                pinned: nextPinned,
                state: input.state ?? current.state
              }),
              updatedAt: now().toISOString()
            };

            const stored = yield* trxDatabase.voiceExamples.save({
              ...updatedDomain,
              version: current.version
            } satisfies VoiceExampleRecord).pipe(Effect.orDie);
            yield* persistBackendAuditEvent(trxDatabase, {
              logicalKey: `voice-example:${stored.id}:updated:${stored.updatedAt}`,
              actorId: userId,
              actorType: "application_user",
              resourceType: "voice_example",
              resourceId: stored.id,
              mutationType: "voice_example.updated",
              occurredAt: stored.updatedAt,
              metadata: {
                state: stored.state,
                explicitContentType: stored.explicitContentType ?? null,
                pinned: stored.pinned,
                targetProfileVersion: stored.targetProfileVersion
              }
            });
            return stored;
          })
        ).pipe(
          Effect.catchTag("DatabaseTransactionInvariantError", (error) => Effect.die(error))
        );

        if (!updatedRecord) {
          return undefined;
        }
        logger?.info("Updated voice example", {
          userId,
          exampleId: updatedRecord.id,
          state: updatedRecord.state,
          pinned: updatedRecord.pinned
        });

        yield* voiceRebuild.schedule(userId);
        return toVoiceExampleListItemView(updatedRecord, updatedRecord.version);
      });
    }
  };
}
