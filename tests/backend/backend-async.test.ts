import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { decodeExecutionStatusView, decodeQueuedExecutionView } from "@my-ai-orchestrator/contracts";
import { createBackendApp } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendExecutionService } from "../../apps/backend";
import { createBackendJobStoreService } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { processQueuedJob } from "../../apps/backend";
import { AIAdapterTransportError } from "../../packages/ai-adapters";
import { createBackendTestAuthorizationHeader } from "../../apps/backend/src/auth/index.js";
import { createBackendAppTestApp, seedExecutionVoiceState } from "./backend-app.fixtures.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { mergeCompositorPipelineContext } from "../../apps/backend/src/product/generation/merge-compositor-pipeline-context.js";

describe("backend async flow", () => {
  const config: BackendConfig = {
    environment: "test",
    executionMode: "async",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR",
    serviceName: "backend",
    host: "127.0.0.1",
    port: 3000,
    version: "0.1.0",
    billingPlanId: "criador",
    billingUserId: "user_1"
  };

  it("replays job progress over SSE from the backend route", async () => {
    const startedAt = new Date("2026-05-11T00:00:00.000Z");
    const now = new Date("2026-05-11T00:00:05.000Z");
    const services = Effect.runSync(createBackendProductServices(config, { now: () => startedAt }));
    seedExecutionVoiceState(services, "user_1");
    const app = createBackendAppTestApp(
      {
        ...config,
        billingUserId: "user_1"
      },
      services
    );

    const response = await app.request("/me/executions/run", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        rhetoricalMode: "expound",
        scope: { lengthTier: "short" },
        briefing: {
          topic: "SSE replay",
          keyPoints: ["queued", "progress", "done"]
        }
      })
    });

    const body = await response.json();
    const created = await Effect.runPromise(decodeQueuedExecutionView(body));
    const completed = await waitForJobStatus(app, created.jobId, "done");

    expect(completed.status).toBe("done");

    const eventsResponse = await app.request(`/me/executions/${created.jobId}/events`, {
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId: "user_1" })
      }
    });
    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.headers.get("content-type")).toContain("text/event-stream");

    const payload = await readSseUntil(eventsResponse, 'event: done');

    expect(payload).toContain('event: progress');
    expect(payload).toContain('"currentStep":"queued"');
    expect(payload).toContain('event: done');
    expect(payload).toContain('"type":"done"');
    expect(payload).toContain('provider:gemini:');
  });

  it("persists failed jobs through the worker path", async () => {
    const now = () => new Date("2026-05-11T00:00:05.000Z");
    const healthyServices = Effect.runSync(createBackendProductServices(config, { now }));
    seedExecutionVoiceState(healthyServices, "backend");
    const failingServices = {
      ...healthyServices,
      aiAdapters: {
        complete: () =>
          Effect.fail(
            new AIAdapterTransportError({
              provider: "openai",
              message: "simulated transport failure"
            })
          )
      }
    };
    const jobStore = Effect.runSync(createBackendJobStoreService());
    let queuedJob:
      | import("../../apps/backend").BackendQueuedJob
      | undefined;

    const execution = createBackendExecutionService({
      config,
      jobStore,
      services: healthyServices,
      now,
      onQueuedJob: (job) => {
        queuedJob = job;
      }
    });

    // A raw SimplifiedPipelineRequest bypasses resolveGenerationTarget (and the context it
    // populates), so pricing (now size-keyed via pricesByPlan) needs the same compositor
    // metadata a real /me/executions/run request would carry — build it the same way.
    const plan = planGeneration({
      rhetoricalMode: "expound",
      scope: { lengthTier: "short" },
      qualityMode: "balanced"
    });
    const context = mergeCompositorPipelineContext(undefined, plan, "unspecified");

    const queued = await Effect.runPromise(
      execution.execute({
        userId: "backend",
        pipelineType: plan.planSignature,
        contentType: plan.planSignature,
        context,
        briefing: {
          topic: "Worker failure path"
        }
      })
    );

    expect("jobId" in queued).toBe(true);

    await processQueuedJob(
      {
        config,
        jobStore,
        services: failingServices,
        now
      },
      queuedJob!
    );

    const failed = await Effect.runPromise(jobStore.getJobStatus(queued.jobId));
    const events = await Effect.runPromise(jobStore.listJobEvents(queued.jobId));

    expect(failed?.status).toBe("failed");
    expect(failed?.error?.message).toContain('Pipeline "short-piece" failed at step "hook"');
    expect(failed?.error?.message).toContain("simulated transport failure");
    expect(events.at(-1)?.type).toBe("error");
  });
});

async function waitForJobStatus(app: ReturnType<typeof createBackendApp>, jobId: string, expected: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await app.request(`/me/executions/${jobId}`, {
      headers: {
        authorization: createBackendTestAuthorizationHeader({ userId: "user_1" })
      }
    });
    const body = await response.json();
    const decoded = await Effect.runPromise(decodeExecutionStatusView(body));
    if (decoded.status === expected) {
      return decoded;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const finalResponse = await app.request(`/me/executions/${jobId}`, {
    headers: {
      authorization: createBackendTestAuthorizationHeader({ userId: "user_1" })
    }
  });
  const finalBody = await finalResponse.json();
  return Effect.runPromise(decodeExecutionStatusView(finalBody));
}

async function readSseUntil(response: Response, marker: string): Promise<string> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    return "";
  }

  let result = "";

  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      result += decoder.decode(value, { stream: true });
      if (result.includes(marker)) {
        break;
      }
    }
  } finally {
    await reader.cancel();
  }

  return result;
}
