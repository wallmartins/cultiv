import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createDatabase,
  DatabaseTransactionInvariantError,
  hydrateDatabase
} from "../../packages/database/src/index.js";

describe("database audit repository", () => {
  it("dedupes logical mutations and survives rehydration", () => {
    const database = createDatabase();

    Effect.runSync(
      database.audit.putIfAbsent({
        id: "audit:1",
        logicalKey: "voice-example:example-1:created:2026-05-31T12:00:00.000Z",
        actorId: "user_1",
        actorType: "application_user",
        resourceType: "voice_example",
        resourceId: "example-1",
        mutationType: "voice_example.created",
        occurredAt: "2026-05-31T12:00:00.000Z",
        metadata: { pinned: true }
      })
    );
    Effect.runSync(
      database.audit.putIfAbsent({
        id: "audit:2",
        logicalKey: "voice-example:example-1:created:2026-05-31T12:00:00.000Z",
        actorId: "user_1",
        actorType: "application_user",
        resourceType: "voice_example",
        resourceId: "example-1",
        mutationType: "voice_example.created",
        occurredAt: "2026-05-31T12:00:00.000Z",
        metadata: { pinned: false }
      })
    );

    const snapshot = database.snapshot();
    const rehydrated = hydrateDatabase(snapshot);
    const records = Effect.runSync(rehydrated.audit.list());

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: "audit:1",
      logicalKey: "voice-example:example-1:created:2026-05-31T12:00:00.000Z"
    });
  });

  it("keeps audit and business writes consistent under rollback", () => {
    const database = createDatabase();

    const result = Effect.runSync(
      Effect.either(
        database.transaction((trxDatabase) =>
          Effect.gen(function* () {
            yield* trxDatabase.voiceExamples.create({
              id: "example-rollback",
              userId: "user_1",
              text: "Should roll back together.",
              language: "pt-BR",
              state: "active",
              classificationLabels: ["positive"],
              antiPatternsExplicit: [],
              pinned: false,
              pendingProfileImpact: true,
              targetProfileVersion: 1,
              effectiveContentTypeHints: ["newsletter"],
              evaluation: {
                attentionLevel: "medium",
                contributionCode: "useful_for_general",
                contributionPreview: "Rollback example",
                userPinned: false
              },
              createdAt: "2026-05-31T12:10:00.000Z",
              updatedAt: "2026-05-31T12:10:00.000Z"
            });
            yield* trxDatabase.audit.putIfAbsent({
              id: "audit:rollback",
              logicalKey: "voice-example:example-rollback:created:2026-05-31T12:10:00.000Z",
              actorId: "user_1",
              actorType: "application_user",
              resourceType: "voice_example",
              resourceId: "example-rollback",
              mutationType: "voice_example.created",
              occurredAt: "2026-05-31T12:10:00.000Z",
              metadata: {}
            });
            return yield* Effect.fail(
              new DatabaseTransactionInvariantError({
                message: "rollback"
              })
            );
          })
        )
      )
    );

    expect(result._tag).toBe("Left");
    expect(Effect.runSync(database.voiceExamples.get("example-rollback"))).toBeUndefined();
    expect(Effect.runSync(database.audit.list())).toHaveLength(0);
  });
});
