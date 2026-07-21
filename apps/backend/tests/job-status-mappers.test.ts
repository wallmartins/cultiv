import { describe, expect, it } from "vitest";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { JobRecord } from "@my-ai-orchestrator/database";
import {
  resolveContentType,
  resolveEstimatedSteps,
  toJobStatusResponse
} from "../src/jobs/job-status-mappers.js";

describe("job status mappers", () => {
  it("resolveContentType with pipeline request returns pipeline.name", () => {
    const request: PipelineRequest = {
      pipeline: {
        name: "custom-pipeline",
        steps: [{ name: "step-1", skill: "skill-1" }]
      },
      inputs: {}
    };

    expect(resolveContentType(request)).toBe("custom-pipeline");
  });

  it("resolveContentType with contentType request returns contentType", () => {
    const request: PipelineRequest = {
      userId: "user-1",
      pipelineType: "twitter-thread",
      briefing: "Test",
      contentType: "custom-content-type"
    };

    expect(resolveContentType(request)).toBe("custom-content-type");
  });

  it("resolveEstimatedSteps uses pipeline step count", () => {
    const request: PipelineRequest = {
      pipeline: {
        name: "custom-pipeline",
        steps: [
          { name: "step-1", skill: "skill-1" },
          { name: "step-2", skill: "skill-2" }
        ]
      },
      inputs: {}
    };

    expect(resolveEstimatedSteps(request)).toBe(2);
  });

  it("toJobStatusResponse maps JobRecord fields correctly", () => {
    const record: JobRecord = {
      id: "job-1",
      status: "running",
      contentType: "twitter-thread",
      progress: {
        currentStep: "draft",
        stepIndex: 1,
        totalSteps: 3,
        percent: 33
      },
      result: null,
      error: null,
      createdAt: "2026-06-18T10:00:00.000Z",
      completedAt: null,
      executionMode: "async",
      pipelineId: "twitter-thread",
      version: 1,
      progressHistory: [],
      updatedAt: "2026-06-18T10:05:00.000Z",
      history: []
    };

    expect(toJobStatusResponse(record, { userId: "user-1" })).toEqual({
      jobId: "job-1",
      status: "running",
      contentType: "twitter-thread",
      progress: record.progress,
      result: null,
      error: null,
      createdAt: "2026-06-18T10:00:00.000Z",
      completedAt: null,
      voice: undefined,
      userId: "user-1",
      reservedCredits: undefined
    });
  });

  it("toJobStatusResponse surfaces reservedCredits from the runtime payload for a queued/running execution", () => {
    const record: JobRecord = {
      id: "job-2",
      status: "queued",
      contentType: "twitter-thread",
      progress: {
        currentStep: "queued",
        stepIndex: 0,
        totalSteps: 3,
        percent: 0
      },
      result: null,
      error: null,
      createdAt: "2026-06-18T10:00:00.000Z",
      completedAt: null,
      executionMode: "async",
      pipelineId: "twitter-thread",
      version: 1,
      progressHistory: [],
      updatedAt: "2026-06-18T10:00:00.000Z",
      history: []
    };

    expect(toJobStatusResponse(record, { userId: "user-1", reservedCredits: 5 }).reservedCredits).toBe(5);
  });

  it("toJobStatusResponse leaves reservedCredits undefined when the runtime has none (sync/simulate)", () => {
    const record: JobRecord = {
      id: "job-3",
      status: "running",
      contentType: "twitter-thread",
      progress: {
        currentStep: "draft",
        stepIndex: 1,
        totalSteps: 3,
        percent: 33
      },
      result: null,
      error: null,
      createdAt: "2026-06-18T10:00:00.000Z",
      completedAt: null,
      executionMode: "async",
      pipelineId: "twitter-thread",
      version: 1,
      progressHistory: [],
      updatedAt: "2026-06-18T10:05:00.000Z",
      history: []
    };

    expect(toJobStatusResponse(record, { userId: "user-1" }).reservedCredits).toBeUndefined();
  });
});
