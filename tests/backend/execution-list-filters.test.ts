import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import {
  matchesExecutionsListFilters,
  normalizeExecutionsListFilters,
  resolveExecutionsPeriodCutoff
} from "@my-ai-orchestrator/contracts";
import { createBackendApplicationUserMemoryRepository } from "../../apps/backend/src/auth/application-user-memory.js";
import { createBackendTestAccessToken } from "../../apps/backend/src/auth/test-auth.js";
import { createInMemoryJobRepository, snapshotStoredJob } from "../../apps/backend/src/jobs/in-memory-job-repository.js";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import { Ref } from "effect";
import { createTestConfig, createMinimalServices, createTestApp } from "../../apps/backend/tests/test-helpers.js";

function createPipelineRequest(userId: string, contentType = "twitter-thread"): PipelineRequest {
  return {
    userId,
    pipelineType: "twitter-thread",
    briefing: "Fixture",
    contentType
  };
}

function createIntentPipelineRequest(userId: string): PipelineRequest {
  return {
    userId,
    pipeline: { name: "short-piece", steps: [] },
    inputs: { topic: "Tema da expedição" },
    context: {
      generationIntent: "share-idea",
      generationChannel: "professional-network",
      compositor: {
        planId: "plan-1",
        planSignature: "short-piece",
        expressionProfile: "hook",
        lengthTier: "short",
        wordTarget: { min: 150, max: 400 }
      }
    }
  };
}

describe("execution list filters", () => {
  it("normalizes query filters and matches jobs by period, status, intent, and length tier", () => {
    const now = Date.parse("2026-06-24T12:00:00.000Z");
    const filters = normalizeExecutionsListFilters({
      period: "7d",
      status: "done",
      intent: "update-subscribers",
      lengthTier: "long"
    });

    expect(resolveExecutionsPeriodCutoff("7d", now)).toBe("2026-06-17T12:00:00.000Z");
    expect(
      matchesExecutionsListFilters(
        {
          createdAt: "2026-06-20T00:00:00.000Z",
          status: "done",
          contentType: "newsletter",
          generationIntent: "update-subscribers",
          lengthTier: "long"
        },
        filters
      )
    ).toBe(true);
    expect(
      matchesExecutionsListFilters(
        {
          createdAt: "2026-06-01T00:00:00.000Z",
          status: "done",
          contentType: "newsletter",
          generationIntent: "update-subscribers",
          lengthTier: "long"
        },
        filters
      )
    ).toBe(false);
    expect(
      matchesExecutionsListFilters(
        {
          createdAt: "2026-06-20T00:00:00.000Z",
          status: "failed",
          contentType: "newsletter",
          generationIntent: "update-subscribers",
          lengthTier: "long"
        },
        filters
      )
    ).toBe(false);
  });

  it("filters in-memory jobs by resolved presentation metadata", () => {
    const jobsRef = Effect.runSync(Ref.make(new Map()));
    const repository = createInMemoryJobRepository(jobsRef);
    const old = Effect.runSync(
      repository.createQueuedJob(createPipelineRequest("user-a", "newsletter"), {
        createdAt: "2026-05-01T00:00:00.000Z"
      })
    );
    const recent = Effect.runSync(
      repository.createQueuedJob(createIntentPipelineRequest("user-a"), {
        createdAt: "2026-06-20T00:00:00.000Z"
      })
    );
    Effect.runSync(repository.completeJob(old.jobId, { content: "ok", metadata: {} }, "2026-05-01T01:00:00.000Z"));
    Effect.runSync(repository.failJob(recent.jobId, { message: "boom", step: null }, "2026-06-20T01:00:00.000Z"));

    const page = Effect.runSync(
      repository.listJobsForUser("user-a", 10, 0, {
        period: "30d",
        status: "failed",
        intent: "share-idea",
        lengthTier: "short"
      })
    );

    expect(page.total).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.jobId).toBe(recent.jobId);
    expect(snapshotStoredJob(page.items[0]!).briefingTopic).toBe("Tema da expedição");
    expect(page.items.some((item) => item.jobId === old.jobId)).toBe(false);
  });

  it("passes decoded filters from GET /me/executions to listJobsForUser", async () => {
    const config = createTestConfig();
    const users = createBackendApplicationUserMemoryRepository();
    Effect.runSync(users.create({ id: "user-1", externalSubject: "auth0|test-user", status: "active" }));
    const services = createMinimalServices({ users });
    const listJobsForUser = vi.fn(() =>
      Effect.succeed({
        items: [],
        total: 0
      })
    );
    const app = createTestApp(config, services, { listJobsForUser });
    const token = createBackendTestAccessToken({ userId: "auth0|test-user" });

    const response = await app.request(
      "/me/executions?period=30d&status=done&intent=share-idea&lengthTier=short&limit=5&offset=10",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    expect(response.status).toBe(200);
    expect(listJobsForUser).toHaveBeenCalledWith("user-1", 5, 10, {
      period: "30d",
      status: "done",
      intent: "share-idea",
      lengthTier: "short"
    });
  });
});
