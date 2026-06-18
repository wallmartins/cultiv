import { describe, expect, it } from "vitest";
import { buildOrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  buildEnqueueCreatedResponse,
  buildEnqueueProgressEvent,
  buildExecutionJobRecord,
  buildQueuedJobProgress,
  buildRuntimeBase,
  resolveEnqueueEstimatedSteps,
  resolveEnqueueUserId
} from "../src/runtime/execution-enqueue-transaction.js";

function createPipelineRequest(overrides: Partial<PipelineRequest> = {}): PipelineRequest {
  return {
    userId: "user-42",
    pipelineType: "validation-post",
    contentType: "validation-post",
    briefing: { topic: "Enqueue test", keyPoints: ["atomic"] },
    ...overrides
  } as PipelineRequest;
}

describe("execution enqueue transaction builders", () => {
  it("resolveEnqueueUserId returns request userId when present", () => {
    expect(resolveEnqueueUserId(createPipelineRequest({ userId: "user-42" }))).toBe("user-42");
  });

  it("resolveEnqueueUserId falls back to anonymous when userId is missing", () => {
    const request = {
      pipeline: {
        name: "custom-pipeline",
        steps: [{ name: "step-1", skill: "skill-1" }]
      },
      inputs: {}
    } satisfies PipelineRequest;

    expect(resolveEnqueueUserId(request)).toBe("anonymous");
  });

  it("resolveEnqueueEstimatedSteps uses plan step count with minimum of 1", () => {
    const plan = buildOrchestrationPlan(createPipelineRequest(), {
      executionMode: "async",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR"
    });

    expect(resolveEnqueueEstimatedSteps(plan)).toBe(plan.pipeline.steps.length);
  });

  it("buildRuntimeBase captures enqueue context without credit reservation", () => {
    const request = createPipelineRequest();
    const plan = buildOrchestrationPlan(request, {
      executionMode: "async",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR"
    });
    const estimatedSteps = resolveEnqueueEstimatedSteps(plan);

    expect(
      buildRuntimeBase({
        userId: "user-42",
        request,
        plan,
        estimatedSteps,
        voice: { voiceId: "voice-1", profileVersion: 1 },
        simulateCredits: true
      })
    ).toEqual({
      userId: "user-42",
      request,
      plan,
      estimatedSteps,
      voice: { voiceId: "voice-1", profileVersion: 1 },
      pricingEnvelope: undefined,
      simulateCredits: true
    });
  });

  it("buildQueuedJobProgress returns zeroed queued progress", () => {
    expect(buildQueuedJobProgress(3)).toEqual({
      currentStep: "queued",
      stepIndex: 0,
      totalSteps: 3,
      percent: 0
    });
  });

  it("buildExecutionJobRecord shapes persisted job document", () => {
    const request = createPipelineRequest();
    const plan = buildOrchestrationPlan(request, {
      executionMode: "async",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR"
    });
    const estimatedSteps = resolveEnqueueEstimatedSteps(plan);
    const createdAt = "2026-06-18T12:00:00.000Z";
    const runtime = {
      ...buildRuntimeBase({
        userId: "user-42",
        request,
        plan,
        estimatedSteps
      }),
      creditReservationId: "reservation-1"
    };

    expect(
      buildExecutionJobRecord({
        jobId: "job-1",
        plan,
        runtime,
        estimatedSteps,
        createdAt
      })
    ).toEqual({
      id: "job-1",
      status: "queued",
      executionMode: plan.request.executionMode,
      contentType: plan.contentType.id,
      createdAt,
      completedAt: null,
      pipelineId: plan.pipeline.name,
      version: 1,
      progress: buildQueuedJobProgress(estimatedSteps),
      progressHistory: [],
      result: null,
      error: null,
      updatedAt: createdAt,
      history: [
        {
          type: "created",
          at: createdAt,
          payload: {
            runtime,
            contentType: plan.contentType.id,
            executionMode: plan.request.executionMode,
            pipelineName: plan.pipeline.name
          }
        }
      ]
    });
  });

  it("buildEnqueueCreatedResponse maps API response fields", () => {
    const request = createPipelineRequest();
    const plan = buildOrchestrationPlan(request, {
      executionMode: "async",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR"
    });
    const createdAt = "2026-06-18T12:00:00.000Z";

    expect(
      buildEnqueueCreatedResponse({
        jobId: "job-1",
        plan,
        estimatedSteps: 2,
        createdAt
      })
    ).toEqual({
      jobId: "job-1",
      status: "queued",
      contentType: plan.contentType.id,
      estimatedSteps: 2,
      createdAt
    });
  });

  it("buildEnqueueProgressEvent publishes initial queued progress", () => {
    const createdAt = "2026-06-18T12:00:00.000Z";

    expect(buildEnqueueProgressEvent("job-1", 2, createdAt)).toEqual({
      type: "progress",
      jobId: "job-1",
      payload: buildQueuedJobProgress(2),
      occurredAt: createdAt
    });
  });
});
