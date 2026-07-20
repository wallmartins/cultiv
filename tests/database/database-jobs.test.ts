import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import {
  createDatabase,
  DatabaseJobAlreadyExistsError,
  DatabaseJobNotFoundError,
  DatabaseTransactionInvariantError,
  hydrateDatabase,
  toJobDomain,
  toJobRecord
} from "../../packages/database/src/index.js";

describe("database jobs", () => {
  it("maps domain jobs to persistent records and back", () => {
    const record = toJobRecord({
      id: "job_1",
      status: "queued",
      executionMode: "sync",
      contentType: "validation-post",
      createdAt: "2026-05-09T00:00:00.000Z",
      completedAt: null
    });

    const domain = toJobDomain(record);

    expect(record.version).toBe(1);
    expect(record.progress.percent).toBe(0);
    expect(domain).toEqual({
      id: "job_1",
      status: "queued",
      executionMode: "sync",
      contentType: "validation-post",
      createdAt: "2026-05-09T00:00:00.000Z",
      completedAt: null
    });
  });

  it("persists jobs, history and rolls back failed transactions", async () => {
    const database = createDatabase();
    const created = Effect.runSync(
      database.jobs.create({
        id: "job_2",
        status: "queued",
        executionMode: "async",
        contentType: "newsletter",
        createdAt: "2026-05-09T00:00:00.000Z",
        completedAt: null
      })
    );

    expect(created.history[0]?.type).toBe("created");
    expect(created.progressHistory).toHaveLength(1);

    const result = await Effect.runPromise(
      Effect.either(
        database.transaction((tx) =>
          Effect.gen(function* () {
            yield* tx.jobs.recordProgress("job_2", { currentStep: "draft", stepIndex: 1, totalSteps: 4, percent: 25 }, "2026-05-09T00:01:00.000Z");
            yield* tx.jobs.fail(
              "job_2",
              {
                message: "boom",
                step: "draft"
              },
              "2026-05-09T00:02:00.000Z"
            );
            yield* Effect.fail(new DatabaseTransactionInvariantError({ message: "rollback" }));
          })
        )
      )
    );

    expect(result._tag).toBe("Left");
    expect(result.left).toMatchObject({
      _tag: "DatabaseTransactionInvariantError"
    });

    const persisted = Effect.runSync(database.jobs.findById("job_2"));
    expect(persisted?.status).toBe("queued");
    expect(persisted?.history).toHaveLength(1);
    expect(persisted?.progressHistory).toHaveLength(1);
  });

  it("tracks progress history and can be rehydrated from a snapshot", () => {
    const database = createDatabase();
    Effect.runSync(database.jobs.create({
      id: "job_4",
      status: "queued",
      executionMode: "async",
      contentType: "newsletter",
      createdAt: "2026-05-09T00:00:00.000Z",
      completedAt: null
    }));

    Effect.runSync(database.jobs.recordProgress(
      "job_4",
      {
        currentStep: "outline",
        stepIndex: 0,
        totalSteps: 4,
        percent: 25
      },
      "2026-05-09T00:01:00.000Z"
    ));
    Effect.runSync(database.jobs.recordProgress(
      "job_4",
      {
        currentStep: "draft",
        stepIndex: 1,
        totalSteps: 4,
        percent: 50
      },
      "2026-05-09T00:02:00.000Z"
    ));

    const snapshot = database.snapshot();
    const rehydrated = hydrateDatabase(snapshot);
    const job = Effect.runSync(rehydrated.jobs.findById("job_4"));

    expect(job?.progressHistory).toHaveLength(3);
    expect(job?.progressHistory[0]?.progress.percent).toBe(0);
    expect(job?.progressHistory[2]?.progress.percent).toBe(50);
  });

  it("scopes listByUser and countByUser to the requested user", () => {
    const database = createDatabase();
    const createdAt = "2026-05-09T00:00:00.000Z";

    const createJobForUser = (id: string, userId: string) =>
      database.jobs.create(
        {
          id,
          status: "queued",
          executionMode: "async",
          contentType: "newsletter",
          createdAt,
          completedAt: null
        },
        {
          history: [
            {
              type: "created",
              at: createdAt,
              payload: {
                runtime: { userId }
              }
            }
          ]
        }
      );

    Effect.runSync(createJobForUser("job_user_a", "user-a"));
    Effect.runSync(createJobForUser("job_user_b", "user-b"));
    Effect.runSync(createJobForUser("job_user_a2", "user-a"));

    const userAList = Effect.runSync(database.jobs.listByUser("user-a", 10, 0));
    expect(userAList.map((job) => job.id).sort()).toEqual(["job_user_a", "job_user_a2"].sort());
    expect(Effect.runSync(database.jobs.countByUser("user-a"))).toBe(2);
    expect(Effect.runSync(database.jobs.countByUser("user-b"))).toBe(1);
    expect(Effect.runSync(database.jobs.listByUser("user-c", 10, 0))).toHaveLength(0);

    const paged = Effect.runSync(database.jobs.listByUser("user-a", 1, 1));
    expect(paged).toHaveLength(1);
    expect(Effect.runSync(database.jobs.countByUser("user-a"))).toBe(2);
  });

  it("applies list filters before pagination and count", () => {
    // Fixtures com data absoluta + janela "30d" medida contra Date.now(): sem relógio fixo
    // o teste caduca sozinho quando 2026-06-20 sai dos últimos 30 dias.
    vi.setSystemTime(Date.parse("2026-06-24T12:00:00.000Z"));

    const database = createDatabase();
    const createJob = (id: string, status: "queued" | "done", createdAt: string, contentType: string) =>
      Effect.runSync(
        database.jobs.create(
          {
            id,
            status,
            executionMode: "async",
            contentType,
            createdAt,
            completedAt: status === "done" ? createdAt : null
          },
          {
            history: [
              {
                type: "created",
                at: createdAt,
                payload: { runtime: { userId: "user-a" } }
              }
            ]
          }
        )
      );

    createJob("old-done", "done", "2026-05-01T00:00:00.000Z", "newsletter");
    createJob("recent-failed", "queued", "2026-06-20T00:00:00.000Z", "twitter-thread");
    Effect.runSync(
      database.jobs.fail(
        "recent-failed",
        { message: "boom" },
        "2026-06-20T01:00:00.000Z"
      )
    );

    const filters = {
      period: "30d" as const,
      status: "failed" as const,
      contentType: "twitter-thread"
    };

    expect(Effect.runSync(database.jobs.countByUser("user-a", filters))).toBe(1);
    expect(Effect.runSync(database.jobs.listByUser("user-a", 10, 0, filters)).map((job) => job.id)).toEqual([
      "recent-failed"
    ]);

    vi.useRealTimers();
  });

  it("throws typed errors for duplicate and missing jobs", () => {
    const database = createDatabase();
    Effect.runSync(database.jobs.create({
      id: "job_5",
      status: "queued",
      executionMode: "sync",
      contentType: "validation-post",
      createdAt: "2026-05-09T00:00:00.000Z",
      completedAt: null
    }));

    const duplicate = Effect.runSync(Effect.either(database.jobs.create({
      id: "job_5",
      status: "queued",
      executionMode: "sync",
      contentType: "validation-post",
      createdAt: "2026-05-09T00:00:00.000Z",
      completedAt: null
    })));
    expect(duplicate._tag).toBe("Left");
    expect(duplicate.left).toBeInstanceOf(DatabaseJobAlreadyExistsError);

    const missing = Effect.runSync(
      Effect.either(database.jobs.recordProgress("missing", { currentStep: "draft", stepIndex: 0, totalSteps: 1, percent: 0 }))
    );
    expect(missing._tag).toBe("Left");
    expect(missing.left).toBeInstanceOf(DatabaseJobNotFoundError);
  });
});
