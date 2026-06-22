import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { AIProviderRequest } from "../../packages/ai-adapters";
import { createBackendExecutionService, createBackendProductServices } from "../../apps/backend";
import { processQueuedJob } from "../../apps/backend/src/jobs/worker-job.js";
import { createBackendPublicGenerationService } from "../../apps/backend/src/product/generation/public-generation.js";
import { CALIBRATION_BRIEFINGS } from "../../apps/backend/scripts/calibration/briefings.js";
import { planGeneration } from "../../apps/backend/src/product/generation/compositor/compositor-planner.js";
import {
  isDurableTestRedisAvailable,
  shouldRunDurableRuntimeIntegrationTests,
  type DurableTestContext
} from "./durable-test-helpers.js";
import { seedExecutionVoiceState } from "./backend-app.fixtures.js";
import {
  runPostgresTests,
  shouldRunPostgresIntegrationTests
} from "../../apps/backend/tests/postgres-test-helpers.js";

const shouldRunCompositorExecutionIntegrationTests =
  runPostgresTests && Boolean(process.env.BACKEND_TEST_DATABASE_URL);

const describeIfPostgres = shouldRunCompositorExecutionIntegrationTests ? describe : describe.skip;

type DurableHelpers = typeof import("./durable-test-helpers.js");

describeIfPostgres("compositor execution integration", () => {
  let context: DurableTestContext;
  let helpers: DurableHelpers;

  beforeAll(async () => {
    if (!(await shouldRunPostgresIntegrationTests())) {
      throw new Error("PostgreSQL integration prerequisites are not available");
    }

    if (!(await isDurableTestRedisAvailable())) {
      throw new Error("Redis is required for compositor execution integration tests");
    }

    const durableAvailable = await shouldRunDurableRuntimeIntegrationTests();
    if (!durableAvailable) {
      throw new Error("Durable runtime integration prerequisites are not available");
    }

    helpers = await import("./durable-test-helpers.js");
    context = await helpers.openDurableTestContext({
      compositorV1Enabled: true,
      executionMode: "async"
    });
  }, 30_000);

  afterAll(async () => {
    await helpers.closeDurableTestContext(context);
  }, 30_000);

  beforeEach(async () => {
    await helpers.resetDurableTestState(context);
  }, 30_000);

  it("persists edition-piece planSignature through enqueue and worker completion", async () => {
    const userId = context.config.billingUserId!;
    const services = Effect.runSync(
      createBackendProductServices(context.config, {
        now: () => new Date("2026-06-14T12:00:00.000Z")
      })
    );
    seedExecutionVoiceState(services, userId);

    const runtime = helpers.createDurableRuntimeForContext(context);
    let queuedJob:
      | {
          readonly jobId: string;
          readonly request: import("@my-ai-orchestrator/contracts").PipelineRequest;
          readonly plan: import("@my-ai-orchestrator/orchestrator").OrchestrationPlan;
          readonly pricingEnvelope?: import("../../apps/backend/src/product/ai-policy/ai-policy-types.js").ResolvedPricingEnvelope;
        }
      | undefined;

    const execution = createBackendExecutionService({
      config: context.config,
      jobStore: runtime.jobs,
      services,
      now: () => new Date("2026-06-14T12:00:05.000Z"),
      runtimeMode: "durable",
      durableEnqueue: runtime.jobs.enqueueAtomic,
      providerTransport: createMockProviderTransport(),
      onQueuedJob: (job) => {
        queuedJob = job;
      }
    });

    const publicGeneration = createBackendPublicGenerationService({
      config: context.config,
      services,
      execution
    });

    const expectedPlan = planGeneration({
      intent: "share-idea",
      scope: { lengthTier: "medium", channel: "email" },
      qualityMode: "balanced"
    });
    expect(expectedPlan.planSignature).toBe("edition-piece");

    const queued = await Effect.runPromise(
      publicGeneration.execute({
        userId,
        intent: "share-idea",
        scope: { lengthTier: "medium", channel: "email" },
        qualityMode: "balanced",
        briefing: CALIBRATION_BRIEFINGS["share-idea"],
        idempotencyKey: `compositor-e2e:${Date.now()}`
      })
    );

    expect("jobId" in queued).toBe(true);
    if (!("jobId" in queued)) {
      throw new Error("Expected async job response");
    }

    const payload = await Effect.runPromise(runtime.jobs.getRuntimePayload!(queued.jobId));
    expect(payload?.plan?.pipeline.name).toBe("edition-piece");
    expect(await Effect.runPromise(runtime.jobs.claimQueuedJob(queued.jobId))).toBe(true);

    await processQueuedJob(
      {
        config: context.config,
        jobStore: runtime.jobs,
        services: {
          ...services,
          billing: context.billing
        },
        now: () => new Date("2026-06-14T12:00:10.000Z"),
        providerTransport: createMockProviderTransport()
      },
      {
        jobId: queued.jobId,
        request: payload!.request,
        plan: payload!.plan!,
        pricingEnvelope: payload!.pricingEnvelope,
        simulateCredits: payload!.simulateCredits,
        creditReservationId: payload!.creditReservationId
      }
    );

    const completed = await Effect.runPromise(runtime.jobs.getJobStatus(queued.jobId));
    const jobRow = await context.postgres.db
      .selectFrom("jobs")
      .selectAll()
      .where("id", "=", queued.jobId)
      .executeTakeFirst();
    const persisted = jobRow?.data ? JSON.parse(jobRow.data) : undefined;

    expect(completed?.status).toBe("done");
    expect(completed?.result?.metadata?.planSignature).toBe("edition-piece");
    expect(persisted?.result?.metadata?.planSignature).toBe("edition-piece");
    expect(Array.isArray(persisted?.progressHistory) ? persisted.progressHistory.length : 0).toBeGreaterThanOrEqual(
      expectedPlan.steps.length
    );

    await helpers.closeDurableRuntime(runtime);
    expect(queuedJob).toBeUndefined();
  }, 60_000);
});

function createMockProviderTransport() {
  return {
    complete: (providerRequest: AIProviderRequest) =>
      Effect.succeed({
        choices: [
          {
            message: {
              content: `Generated via ${providerRequest.provider}:${providerRequest.model}`
            },
            finish_reason: "stop" as const
          }
        ],
        usage: {
          promptTokens: 12,
          completionTokens: 24,
          totalTokens: 36
        }
      })
  };
}
