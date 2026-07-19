import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { createDatabase, type DatabaseClient } from "@my-ai-orchestrator/database";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { AppLogger } from "@my-ai-orchestrator/core";
import { createDurableJobRuntime } from "../src/runtime/durable-job-runtime.js";

function seedRunningJob(database: DatabaseClient, jobId: string, creditReservationId?: string) {
  Effect.runSync(
    database.jobs.create(
      {
        id: jobId,
        status: "running",
        executionMode: "async",
        contentType: "twitter-thread",
        createdAt: "2026-07-17T00:00:00.000Z",
        completedAt: null
      },
      {
        progress: { currentStep: "draft", stepIndex: 0, totalSteps: 1, percent: 0 },
        history: [
          {
            type: "created",
            at: "2026-07-17T00:00:00.000Z",
            payload: {
              runtime: {
                userId: "user-1",
                request: {
                  userId: "user-1",
                  pipelineType: "twitter-thread",
                  briefing: "fixture",
                  contentType: "twitter-thread"
                },
                estimatedSteps: 1,
                ...(creditReservationId ? { creditReservationId } : {})
              }
            }
          }
        ]
      }
    )
  );
}

function createFakeRedis() {
  return {
    rpush: vi.fn(async () => 1),
    expire: vi.fn(async () => 1),
    publish: vi.fn(async () => 1),
    lrange: vi.fn(async () => [] as string[])
  };
}

function publishedEventTypes(redis: ReturnType<typeof createFakeRedis>): readonly string[] {
  return redis.publish.mock.calls.map(([, message]) => (JSON.parse(message as string) as { type: string }).type);
}

describe("N3 cancel-in-flight (durable job runtime)", () => {
  it("a late worker completeJob/failJob cannot resurrect an already-cancelled job, nor emit a stray SSE", async () => {
    const database = createDatabase();
    const jobId = "job-durable-1";
    seedRunningJob(database, jobId);
    const redis = createFakeRedis();

    const runtime = createDurableJobRuntime({
      config: {} as any,
      database,
      postgres: {} as any,
      redis: redis as any,
      billing: {
        releaseReservedCredits: () => Effect.succeed({ operation: "releaseReservedCredits", idempotencyKey: "x", value: {} })
      } as unknown as BillingServiceContract,
      billingRepository: {} as any,
      now: () => new Date("2026-07-17T00:05:00.000Z")
    });

    const cancelled = await Effect.runPromise(runtime.cancelJob(jobId, "user requested"));
    expect(cancelled?.status).toBe("cancelled");

    // the worker didn't know it was cancelled — it finishes into the void.
    const afterComplete = await Effect.runPromise(
      runtime.completeJob(jobId, { content: "generated content", metadata: {} })
    );
    expect(afterComplete?.status).toBe("cancelled");
    expect(afterComplete?.result).toBeNull(); // content was NOT delivered

    const afterFail = await Effect.runPromise(runtime.failJob(jobId, { message: "boom", step: null }));
    expect(afterFail?.status).toBe("cancelled");

    // exactly one SSE event was ever published for this job: "cancelled" — no "done"/"error" resurrection.
    expect(publishedEventTypes(redis)).toEqual(["cancelled"]);
  });

  it("surfaces a failed credit release loudly (logged with jobId + reservationId) instead of swallowing it", async () => {
    const database = createDatabase();
    const jobId = "job-durable-2";
    seedRunningJob(database, jobId, "res-leak-1");
    const errors: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    const logger: AppLogger = {
      info: () => undefined,
      warn: () => undefined,
      debug: () => undefined,
      error: (message, meta) => {
        errors.push({ message, meta });
      }
    };

    const runtime = createDurableJobRuntime({
      config: {} as any,
      database,
      postgres: {} as any,
      redis: createFakeRedis() as any,
      billing: {
        releaseReservedCredits: () => Effect.fail(new Error("release backend unavailable"))
      } as unknown as BillingServiceContract,
      billingRepository: {} as any,
      now: () => new Date("2026-07-17T00:05:00.000Z"),
      logger
    });

    const cancelled = await Effect.runPromise(runtime.cancelJob(jobId, "user requested"));
    // the status flip still happens (best-effort v1) — what must NOT happen is silence about the leak.
    expect(cancelled?.status).toBe("cancelled");

    expect(errors).toHaveLength(1);
    expect(errors[0]?.meta).toMatchObject({ jobId, reservationId: "res-leak-1" });
  });
});
