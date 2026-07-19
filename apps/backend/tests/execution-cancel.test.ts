import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { createBackendJobStoreService } from "../src/jobs/job-store.js";

function createPipelineRequest(userId = "user-cancel-1"): PipelineRequest {
  return {
    userId,
    pipelineType: "twitter-thread",
    briefing: "Cancel fixture",
    contentType: "custom-type"
  };
}

describe("N3 cancel-in-flight (in-memory job store)", () => {
  it("cancels a queued job and records a terminal cancelled event", () => {
    const service = Effect.runSync(createBackendJobStoreService());
    const created = Effect.runSync(service.createQueuedJob(createPipelineRequest()));

    const cancelled = Effect.runSync(service.cancelJob(created.jobId, "user requested"));
    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.completedAt).toBeTruthy();

    const events = Effect.runSync(service.listJobEvents(created.jobId));
    const cancelledEvent = events.find((event) => event.type === "cancelled");
    expect(cancelledEvent).toBeDefined();
    expect(cancelledEvent?.payload).toMatchObject({ reason: "user requested" });
  });

  it("cancels a running job", () => {
    const service = Effect.runSync(createBackendJobStoreService());
    const created = Effect.runSync(service.createQueuedJob(createPipelineRequest()));
    Effect.runSync(
      service.updateJobProgress(created.jobId, { currentStep: "draft", stepIndex: 0, totalSteps: 2, percent: 25 })
    );

    const cancelled = Effect.runSync(service.cancelJob(created.jobId));
    expect(cancelled?.status).toBe("cancelled");
  });

  it("is idempotent — cancelling an already-cancelled job is a no-op, not a second event", () => {
    const service = Effect.runSync(createBackendJobStoreService());
    const created = Effect.runSync(service.createQueuedJob(createPipelineRequest()));

    Effect.runSync(service.cancelJob(created.jobId, "first"));
    const secondCall = Effect.runSync(service.cancelJob(created.jobId, "second"));
    expect(secondCall?.status).toBe("cancelled");

    const events = Effect.runSync(service.listJobEvents(created.jobId));
    expect(events.filter((event) => event.type === "cancelled")).toHaveLength(1);
  });

  it("does not cancel an already-terminal job (done)", () => {
    const service = Effect.runSync(createBackendJobStoreService());
    const created = Effect.runSync(service.createQueuedJob(createPipelineRequest()));
    Effect.runSync(service.completeJob(created.jobId, { content: "ok", metadata: {} }));

    const result = Effect.runSync(service.cancelJob(created.jobId));
    expect(result?.status).toBe("done");

    const events = Effect.runSync(service.listJobEvents(created.jobId));
    expect(events.some((event) => event.type === "cancelled")).toBe(false);
  });

  it("a late worker completeJob/failJob cannot resurrect an already-cancelled job, nor emit a stray SSE", () => {
    const service = Effect.runSync(createBackendJobStoreService());
    const created = Effect.runSync(service.createQueuedJob(createPipelineRequest()));
    Effect.runSync(
      service.updateJobProgress(created.jobId, { currentStep: "draft", stepIndex: 0, totalSteps: 2, percent: 25 })
    );
    Effect.runSync(service.cancelJob(created.jobId, "user requested"));

    const afterComplete = Effect.runSync(service.completeJob(created.jobId, { content: "generated content", metadata: {} }));
    expect(afterComplete?.status).toBe("cancelled");
    expect(afterComplete?.result).toBeNull();

    const afterFail = Effect.runSync(service.failJob(created.jobId, { message: "boom", step: null }));
    expect(afterFail?.status).toBe("cancelled");

    const events = Effect.runSync(service.listJobEvents(created.jobId));
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["progress", "cancelled"])
    );
    expect(events.some((event) => event.type === "done" || event.type === "error")).toBe(false);
  });

  it("returns undefined for an unknown job id", () => {
    const service = Effect.runSync(createBackendJobStoreService());
    const result = Effect.runSync(service.cancelJob("unknown-job"));
    expect(result).toBeUndefined();
  });
});
