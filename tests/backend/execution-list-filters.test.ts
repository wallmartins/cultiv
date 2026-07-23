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
  it("normalizes query filters and matches jobs by period, status, and length tier", () => {
    const now = Date.parse("2026-06-24T12:00:00.000Z");
    vi.setSystemTime(now);

    const filters = normalizeExecutionsListFilters({
      period: "7d",
      status: "done",
      lengthTier: "long"
    });

    expect(resolveExecutionsPeriodCutoff("7d", now)).toBe("2026-06-17T12:00:00.000Z");
    expect(
      matchesExecutionsListFilters(
        {
          createdAt: "2026-06-20T00:00:00.000Z",
          status: "done",
          contentType: "newsletter",
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
          lengthTier: "long"
        },
        filters
      )
    ).toBe(false);

    vi.useRealTimers();
  });

  it("#1 matches briefingTopic by case-insensitive substring (q)", () => {
    const filters = normalizeExecutionsListFilters({ q: "Voz" });

    expect(
      matchesExecutionsListFilters(
        { createdAt: "2026-06-20T00:00:00.000Z", status: "done", contentType: "newsletter", briefingTopic: "Mapa de VOZ" },
        filters
      )
    ).toBe(true);
    expect(
      matchesExecutionsListFilters(
        { createdAt: "2026-06-20T00:00:00.000Z", status: "done", contentType: "newsletter", briefingTopic: "Outro tema" },
        filters
      )
    ).toBe(false);
    expect(
      matchesExecutionsListFilters(
        { createdAt: "2026-06-20T00:00:00.000Z", status: "done", contentType: "newsletter" },
        filters
      )
    ).toBe(false);
  });

  it("filters in-memory jobs by resolved presentation metadata", () => {
    // As datas dos fixtures são absolutas e a janela "30d" corre contra o relógio real
    // (resolveExecutionsPeriodCutoff usa Date.now()), então sem relógio fixo este teste
    // passa a falhar sozinho no dia em que 2026-06-20 sai dos últimos 30 dias.
    vi.setSystemTime(Date.parse("2026-06-24T12:00:00.000Z"));

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
        lengthTier: "short"
      })
    );

    expect(page.total).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.jobId).toBe(recent.jobId);
    expect(snapshotStoredJob(page.items[0]!).briefingTopic).toBe("Tema da expedição");
    expect(page.items.some((item) => item.jobId === old.jobId)).toBe(false);

    vi.useRealTimers();
  });

  it("#1 filters in-memory jobs by q against the resolved briefingTopic", () => {
    const jobsRef = Effect.runSync(Ref.make(new Map()));
    const repository = createInMemoryJobRepository(jobsRef);
    const expedition = Effect.runSync(
      repository.createQueuedJob(createIntentPipelineRequest("user-a"), {
        createdAt: "2026-06-20T00:00:00.000Z"
      })
    );
    Effect.runSync(
      repository.createQueuedJob(createPipelineRequest("user-a", "newsletter"), {
        createdAt: "2026-06-21T00:00:00.000Z"
      })
    );

    const page = Effect.runSync(repository.listJobsForUser("user-a", 10, 0, { period: "all", status: "all", q: "expedição" }));

    expect(page.total).toBe(1);
    expect(page.items[0]?.jobId).toBe(expedition.jobId);
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
      "/me/executions?period=30d&status=done&lengthTier=short&q=voz&limit=5&offset=10",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    expect(response.status).toBe(200);
    expect(listJobsForUser).toHaveBeenCalledWith("user-1", 5, 10, {
      period: "30d",
      status: "done",
      lengthTier: "short",
      q: "voz"
    });
  });
});
