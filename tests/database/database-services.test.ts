import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createDatabase,
  createDatabaseLayer,
  DatabaseService,
  summarizeDatabase
} from "../../packages/database/src/index.js";

describe("database services", () => {
  it("provides Effect services for database access", () => {
    const database = createDatabase();

    const result = Effect.runSync(
      Effect.gen(function* () {
        const db = yield* DatabaseService;
        yield* db.jobs.create({
          id: "job_3",
          status: "queued",
          executionMode: "sync",
          contentType: "architecture-post",
          createdAt: "2026-05-09T00:00:00.000Z",
          completedAt: null
        });
        return yield* summarizeDatabase(db);
      }).pipe(Effect.provide(createDatabaseLayer(database)))
    );

    expect(result.jobs).toBe(1);
    expect(result.memories).toBe(0);
    expect(result.contentTypes).toBe(0);
    expect(result.pipelines).toBe(0);
    expect(result.voiceExamples).toBe(0);
    expect(result.voiceProfiles).toBe(0);
  });
});
