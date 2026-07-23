import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createBackendExecutionService } from "../../apps/backend";
import { createBackendJobStoreService } from "../../apps/backend";
import { processQueuedJob } from "../../apps/backend";
import type { BackendConfig } from "../../apps/backend";
import { createBackendProductServices } from "../../apps/backend";
import { AIAdapterTransportError, type AIProviderRequest } from "../../packages/ai-adapters";
import { seedExecutionVoiceState } from "./backend-app.fixtures.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import { mergeCompositorPipelineContext } from "../../apps/backend/src/product/generation/merge-compositor-pipeline-context.js";

describe("backend execution service worker path", () => {
  it("uses the same provider transport path for llm steps in sync and async execution while skipping local steps", async () => {
    // serial-piece has exactly 2 llm steps (draft, tighten) plus 2 local steps (analyze,
    // sanitize) — matches the original 2-llm-call shape this test exercises.
    const plan = planGeneration({
      rhetoricalMode: "narrate",
      scope: { lengthTier: "medium" },
      qualityMode: "fast"
    });
    const compositorContext = mergeCompositorPipelineContext(undefined, plan, "unspecified");
    const generationRequest = {
      userId: "backend",
      pipelineType: plan.planSignature,
      contentType: plan.planSignature,
      briefing: {
        topic: "Shared runtime",
        keyPoints: ["sync", "async", "same core"]
      },
      context: compositorContext,
      qualityMode: "fast",
      model: "gpt-4.1",
      adapter: "openai",
      idempotencyKey: "idem-shared-runtime",
      includeTrace: true
    } as const;

    const syncConfig: BackendConfig = {
      environment: "test",
      executionMode: "sync",
      qualityMode: "balanced",
      defaultLanguage: "pt-BR",
      serviceName: "backend",
      host: "127.0.0.1",
      port: 3000,
      version: "0.1.0",
      billingPlanId: "criador",
      billingUserId: "backend"
    };
    const asyncConfig: BackendConfig = {
      ...syncConfig,
      executionMode: "async"
    };
    const now = () => new Date("2026-05-11T00:00:05.000Z");
    const providerCalls: AIProviderRequest[] = [];
    const providerTransport = {
      complete: (providerRequest: AIProviderRequest) =>
        Effect.gen(function* () {
          providerCalls.push(providerRequest);
          if (providerRequest.model === "gpt-4.1") {
            return yield* Effect.fail(
              new AIAdapterTransportError({
                provider: providerRequest.provider,
                message: `preferred attempt failed for ${providerRequest.model}`
              })
            );
          }

          return {
            choices: [
              {
                message: {
                  content: renderProviderResponse(providerRequest)
                },
                finish_reason: "stop"
              }
            ],
            usage: {
              promptTokens: 11,
              completionTokens: 17,
              totalTokens: 28
            }
          };
        })
    };

    const syncServices = Effect.runSync(createBackendProductServices(syncConfig, { now }));
    seedExecutionVoiceState(syncServices, "backend");
    const syncJobStore = Effect.runSync(createBackendJobStoreService());
    const syncService = createBackendExecutionService({
      config: syncConfig,
      jobStore: syncJobStore,
      services: syncServices,
      now,
      providerTransport
    });
    const syncSnapshot = Effect.runSync(
      syncServices.aiPolicy.resolveExecutionSnapshot({
        request: generationRequest,
        planTier: "pro",
        executionMode: "sync",
        qualityMode: "fast",
        defaultLanguage: "pt-BR"
      })
    );

    const syncResponse = await Effect.runPromise(syncService.executeTrusted(syncSnapshot));

    expect(syncResponse.mode).toBe("sync");
    expect(providerCalls).toHaveLength(2);
    expect(providerCalls.every((call) => call.provider === "gemini" && call.model === "gemini-3.1-flash-lite")).toBe(true);
    const syncTrace = syncResponse.trace as { events?: Array<{ type: string; payload?: Record<string, unknown> }> } | undefined;
    const syncPreferredEvents = syncTrace?.events?.filter((event) => event.type === "provider-attempt" && event.payload?.path === "preferred");
    expect(syncPreferredEvents?.length).toBeGreaterThanOrEqual(2);

    const asyncServices = Effect.runSync(createBackendProductServices(asyncConfig, { now }));
    seedExecutionVoiceState(asyncServices, "backend");
    const asyncJobStore = Effect.runSync(createBackendJobStoreService());
    let queuedJob:
      | {
          readonly jobId: string;
          readonly request: typeof baseRequest;
          readonly plan: {
            readonly pipeline: {
              readonly name: string;
            };
          };
        }
      | undefined;
    const asyncService = createBackendExecutionService({
      config: asyncConfig,
      jobStore: asyncJobStore,
      services: asyncServices,
      now,
      providerTransport,
      onQueuedJob: (job) => {
        queuedJob = job as typeof queuedJob;
      }
    });
    const asyncSnapshot = Effect.runSync(
      asyncServices.aiPolicy.resolveExecutionSnapshot({
        request: generationRequest,
        planTier: "pro",
        executionMode: "async",
        qualityMode: "fast",
        defaultLanguage: "pt-BR"
      })
    );

    const asyncResponse = await Effect.runPromise(asyncService.executeTrusted(asyncSnapshot));

    expect(asyncResponse.status).toBe("queued");
    expect(queuedJob?.jobId).toBe(asyncResponse.jobId);

    await processQueuedJob(
      {
        config: asyncConfig,
        jobStore: asyncJobStore,
        services: asyncServices,
        now,
        providerTransport
      },
      queuedJob!
    );

    const completed = await Effect.runPromise(asyncJobStore.getJobStatus(asyncResponse.jobId));
    const events = await Effect.runPromise(asyncJobStore.listJobEvents(asyncResponse.jobId));

    expect(completed?.status).toBe("done");
    expect(completed?.result?.content).toBe(syncResponse.content);
    expect(providerCalls).toHaveLength(4);
    expect(completed?.result?.metadata).toMatchObject({
      mode: "sync",
      adapter: syncResponse.adapter,
      model: syncResponse.model,
      qualityMode: syncResponse.qualityMode
    });
    const telemetry = completed?.result?.metadata?.telemetry as
      | {
          pricing?: { plannedCreditPrice?: number };
          providers?: { finalProvider?: string; finalModel?: string };
        }
      | undefined;
    expect(telemetry?.pricing?.plannedCreditPrice).toBeGreaterThan(0);
    expect(telemetry?.providers?.finalProvider).toBe("gemini");
    expect(telemetry?.providers?.finalModel).toBe("gemini-3.1-flash-lite");
    expect(events.at(-1)?.type).toBe("done");
    expect(events.some((event) => event.type === "progress")).toBe(true);
  });
});

function renderProviderResponse(providerRequest: AIProviderRequest): string {
  const messages = Array.isArray((providerRequest.body as Record<string, unknown>).messages)
    ? ((providerRequest.body as Record<string, unknown>).messages as Array<Record<string, unknown>>)
    : [];
  const lastMessage = messages.at(-1);
  const content = typeof lastMessage?.content === "string" ? lastMessage.content : providerRequest.model;
  return `provider:${providerRequest.provider}:${content}`;
}
