import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { createDatabase } from "@my-ai-orchestrator/database";
import type {
  ExecutionReactionRecord,
  JobRecord,
  MemoryEntryRecord,
  VoiceExampleBatchRecord
} from "@my-ai-orchestrator/database";

function job(id: string, userId: string): JobRecord {
  const now = new Date().toISOString();
  return {
    id,
    userId,
    status: "done",
    executionMode: "sync",
    contentType: "twitter-thread",
    createdAt: now,
    completedAt: now,
    updatedAt: now,
    version: 1,
    progress: { currentStep: "done", stepIndex: 1, totalSteps: 1, percent: 100 },
    progressHistory: [],
    result: null,
    error: null,
    history: [{ type: "created", at: now, payload: { runtime: { userId } } }]
  } as unknown as JobRecord;
}

function memory(userId: string, key: string): MemoryEntryRecord {
  const now = new Date().toISOString();
  return {
    id: `${userId}:${key}`,
    userId,
    key,
    value: { note: "test" },
    version: 1,
    createdAt: now,
    updatedAt: now
  };
}

function voiceExampleBatch(id: string, userId: string): VoiceExampleBatchRecord {
  const now = new Date().toISOString();
  return { id, userId, data: {}, version: 1, createdAt: now, updatedAt: now };
}

function executionReaction(executionId: string, userId: string): ExecutionReactionRecord {
  const now = new Date().toISOString();
  return { executionId, userId, reaction: "up", createdAt: now, updatedAt: now };
}

// contract-08 §5 task 2 — runnable check: purges all of user A, none of user B.
describe("account bulk-delete isolation", () => {
  it("jobs.removeByUser deletes only the target user's jobs", () => {
    const database = createDatabase({
      jobs: [job("job-a1", "user-a"), job("job-a2", "user-a"), job("job-b1", "user-b")]
    });

    const removed = Effect.runSync(database.jobs.removeByUser("user-a"));
    expect(removed).toBe(2);

    expect(Effect.runSync(database.jobs.findById("job-a1"))).toBeUndefined();
    expect(Effect.runSync(database.jobs.findById("job-a2"))).toBeUndefined();
    expect(Effect.runSync(database.jobs.findById("job-b1"))).toBeDefined();
  });

  it("memories.removeByUser deletes only the target user's memories", () => {
    const database = createDatabase({
      memories: [memory("user-a", "k1"), memory("user-a", "k2"), memory("user-b", "k1")]
    });

    const removed = Effect.runSync(database.memories.removeByUser("user-a"));
    expect(removed).toBe(2);

    expect(Effect.runSync(database.memories.listByUser("user-a"))).toHaveLength(0);
    expect(Effect.runSync(database.memories.listByUser("user-b"))).toHaveLength(1);
  });

  it("voiceExampleBatches.removeByUser deletes only the target user's batches", () => {
    const database = createDatabase({
      voiceExampleBatches: [
        voiceExampleBatch("batch-a1", "user-a"),
        voiceExampleBatch("batch-a2", "user-a"),
        voiceExampleBatch("batch-b1", "user-b")
      ]
    });

    const removed = Effect.runSync(database.voiceExampleBatches.removeByUser("user-a"));
    expect(removed).toBe(2);

    const snapshot = database.snapshot();
    expect(snapshot.voiceExampleBatches["batch-a1"]).toBeUndefined();
    expect(snapshot.voiceExampleBatches["batch-a2"]).toBeUndefined();
    expect(snapshot.voiceExampleBatches["batch-b1"]).toBeDefined();
  });

  it("executionReactions.removeByUser deletes only the target user's reactions", () => {
    const database = createDatabase({
      executionReactions: [
        executionReaction("exec-a1", "user-a"),
        executionReaction("exec-a2", "user-a"),
        executionReaction("exec-b1", "user-b")
      ]
    });

    Effect.runSync(database.executionReactions.removeByUser("user-a"));

    const values = Object.values(database.snapshot().executionReactions);
    expect(values.filter((reaction) => reaction.userId === "user-a")).toHaveLength(0);
    expect(values.filter((reaction) => reaction.userId === "user-b")).toHaveLength(1);
  });
});
