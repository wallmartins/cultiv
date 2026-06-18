import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { JobRecord } from "@my-ai-orchestrator/database";
import { createBackendJobStoreService } from "../src/jobs/job-store.js";
import { toJobStatusResponse } from "../src/jobs/job-status-mappers.js";

const PARITY_FIXTURE = {
  userId: "user-parity-1",
  contentType: "custom-content-type",
  createdAt: "2026-06-18T10:00:00.000Z",
  updatedAt: "2026-06-18T10:05:00.000Z",
  completedAt: null as string | null
} as const;

function createContentTypeStyleRequest(): PipelineRequest {
  return {
    userId: PARITY_FIXTURE.userId,
    pipelineType: "twitter-thread",
    briefing: "Parity contract fixture",
    contentType: PARITY_FIXTURE.contentType
  };
}

function createEquivalentJobRecord(
  jobId: string,
  status: JobRecord["status"],
  progress: JobRecord["progress"]
): JobRecord {
  return {
    id: jobId,
    status,
    contentType: PARITY_FIXTURE.contentType,
    progress,
    result: null,
    error: null,
    createdAt: PARITY_FIXTURE.createdAt,
    completedAt: PARITY_FIXTURE.completedAt,
    executionMode: "async",
    pipelineId: "twitter-thread",
    version: 1,
    progressHistory: [],
    updatedAt: PARITY_FIXTURE.updatedAt,
    history: []
  };
}

function createMemoryJobStoreHarness() {
  const service = Effect.runSync(createBackendJobStoreService());

  return {
    createQueuedJob(
      request: PipelineRequest,
      options?: Parameters<typeof service.createQueuedJob>[1]
    ) {
      return Effect.runSync(service.createQueuedJob(request, options));
    },
    getJobStatus(jobId: string) {
      return Effect.runSync(service.getJobStatus(jobId));
    },
    updateJobProgress(
      jobId: string,
      progress: Parameters<typeof service.updateJobProgress>[1],
      updatedAt?: string
    ) {
      return Effect.runSync(service.updateJobProgress(jobId, progress, updatedAt));
    }
  };
}

describe("job status mapping parity", () => {
  it("memory snapshot and durable mapper agree on jobId, status, and contentType for queued jobs", () => {
    const request = createContentTypeStyleRequest();
    const store = createMemoryJobStoreHarness();
    const created = store.createQueuedJob(request, {
      createdAt: PARITY_FIXTURE.createdAt,
      contentType: PARITY_FIXTURE.contentType
    });

    const memoryStatus = store.getJobStatus(created.jobId);
    const expectedCoreFields = {
      jobId: created.jobId,
      status: "queued" as const,
      contentType: PARITY_FIXTURE.contentType
    };

    const durableStatus = toJobStatusResponse(
      createEquivalentJobRecord(created.jobId, "queued", {
        currentStep: "queued",
        stepIndex: 0,
        totalSteps: 1,
        percent: 0
      }),
      { userId: PARITY_FIXTURE.userId }
    );

    expect(memoryStatus).toMatchObject(expectedCoreFields);
    expect(durableStatus).toEqual(expect.objectContaining(expectedCoreFields));
    expect(memoryStatus?.jobId).toBe(durableStatus.jobId);
    expect(memoryStatus?.status).toBe(durableStatus.status);
    expect(memoryStatus?.contentType).toBe(durableStatus.contentType);
  });

  it("memory snapshot and durable mapper stay aligned while a job is running", () => {
    const request = createContentTypeStyleRequest();
    const store = createMemoryJobStoreHarness();
    const created = store.createQueuedJob(request, {
      createdAt: PARITY_FIXTURE.createdAt,
      contentType: PARITY_FIXTURE.contentType
    });

    const progress = {
      currentStep: "draft",
      stepIndex: 1,
      totalSteps: 3,
      percent: 33
    };

    const memoryStatus = store.updateJobProgress(
      created.jobId,
      progress,
      PARITY_FIXTURE.updatedAt
    );

    const expectedCoreFields = {
      jobId: created.jobId,
      status: "running" as const,
      contentType: PARITY_FIXTURE.contentType
    };

    const durableStatus = toJobStatusResponse(
      createEquivalentJobRecord(created.jobId, "running", progress),
      { userId: PARITY_FIXTURE.userId }
    );

    expect(memoryStatus).toMatchObject(expectedCoreFields);
    expect(durableStatus).toEqual(expect.objectContaining(expectedCoreFields));
    expect(memoryStatus?.jobId).toBe(durableStatus.jobId);
    expect(memoryStatus?.status).toBe(durableStatus.status);
    expect(memoryStatus?.contentType).toBe(durableStatus.contentType);
  });
});
