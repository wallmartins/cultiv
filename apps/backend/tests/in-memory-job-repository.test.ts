import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Effect, Ref } from "effect";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  createInMemoryJobRepository,
  snapshotStoredJob,
  type StoredJob
} from "../src/jobs/in-memory-job-repository.js";

function createPipelineRequest(userId = "user-repo-1"): PipelineRequest {
  return {
    userId,
    pipelineType: "twitter-thread",
    briefing: "Repository fixture",
    contentType: "custom-type"
  };
}

function createRepositoryHarness() {
  const jobsRef = Effect.runSync(Ref.make(new Map<string, StoredJob>()));
  const repository = createInMemoryJobRepository(jobsRef);

  return { repository, jobsRef };
}

describe("in-memory job repository", () => {
  it("creates a queued job with resolved metadata", () => {
    const { repository } = createRepositoryHarness();
    const request = createPipelineRequest();
    const createdAt = "2026-06-18T10:00:00.000Z";

    const job = Effect.runSync(
      repository.createQueuedJob(request, {
        createdAt,
        contentType: "custom-type",
        estimatedSteps: 3
      })
    );

    expect(job.jobId).toBeTruthy();
    expect(job.status).toBe("queued");
    expect(job.contentType).toBe("custom-type");
    expect(job.estimatedSteps).toBe(3);
    expect(job.userId).toBe("user-repo-1");
    expect(job.createdAt).toBe(createdAt);
    expect(job.progress).toBeNull();
  });

  it("reads, lists, and filters jobs by user", () => {
    const { repository } = createRepositoryHarness();
    const createdAt = "2026-06-18T10:00:00.000Z";

    const first = Effect.runSync(
      repository.createQueuedJob(createPipelineRequest("user-a"), { createdAt })
    );
    const second = Effect.runSync(
      repository.createQueuedJob(createPipelineRequest("user-b"), { createdAt })
    );

    expect(Effect.runSync(repository.getJob(first.jobId))?.status).toBe("queued");
    expect(Effect.runSync(repository.listJobs()).map((job) => job.jobId).sort()).toEqual(
      [first.jobId, second.jobId].sort()
    );

    const userPage = Effect.runSync(repository.listJobsForUser("user-a", 10, 0));
    expect(userPage.total).toBe(1);
    expect(userPage.items[0]?.jobId).toBe(first.jobId);
  });

  it("claims only queued jobs and updates lifecycle state", () => {
    const { repository } = createRepositoryHarness();
    const createdAt = "2026-06-18T10:00:00.000Z";
    const updatedAt = "2026-06-18T10:05:00.000Z";
    const completedAt = "2026-06-18T10:10:00.000Z";

    const created = Effect.runSync(
      repository.createQueuedJob(createPipelineRequest(), {
        createdAt,
        estimatedSteps: 2
      })
    );

    expect(Effect.runSync(repository.claimQueuedJob(created.jobId))).toBe(true);
    expect(Effect.runSync(repository.claimQueuedJob(created.jobId))).toBe(false);
    expect(Effect.runSync(repository.getJob(created.jobId))?.status).toBe("running");

    const progress = {
      currentStep: "draft",
      stepIndex: 0,
      totalSteps: 2,
      percent: 50
    };
    const running = Effect.runSync(repository.updateJobProgress(created.jobId, progress, updatedAt));
    expect(running?.status).toBe("running");
    expect(running?.progress).toEqual(progress);

    const done = Effect.runSync(
      repository.completeJob(created.jobId, { output: "ok" }, completedAt)
    );
    expect(done?.status).toBe("done");
    expect(done?.result).toEqual({ output: "ok" });
    expect(done?.progress?.percent).toBe(100);
  });

  it("marks jobs as failed and snapshots API responses", () => {
    const { repository } = createRepositoryHarness();
    const createdAt = "2026-06-18T10:00:00.000Z";
    const failedAt = "2026-06-18T10:07:00.000Z";

    const created = Effect.runSync(repository.createQueuedJob(createPipelineRequest(), { createdAt }));
    const failed = Effect.runSync(
      repository.failJob(
        created.jobId,
        { message: "boom", reason: "unexpected_execution_failure" },
        failedAt
      )
    );

    expect(failed?.status).toBe("failed");
    expect(failed?.error).toEqual({ message: "boom", reason: "unexpected_execution_failure" });
    expect(snapshotStoredJob(failed!)).toMatchObject({
      jobId: created.jobId,
      status: "failed",
      userId: "user-repo-1"
    });
  });

  it("returns undefined for unknown job ids", () => {
    const { repository } = createRepositoryHarness();

    expect(Effect.runSync(repository.getJob(randomUUID()))).toBeUndefined();
    expect(
      Effect.runSync(
        repository.updateJobProgress(randomUUID(), {
          currentStep: "draft",
          stepIndex: 0,
          totalSteps: 1,
          percent: 0
        })
      )
    ).toBeUndefined();
  });
});
