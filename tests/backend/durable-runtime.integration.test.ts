import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createPostgresExecutionIdempotencyStore
} from "../../apps/backend/src/execution/idempotency-store.js";
import {
  appendPersistedExecutionEvent,
  subscribeExecutionEvents
} from "../../apps/backend/src/runtime/execution-events.js";

const shouldRunDurableRuntimeIntegrationTests =
  process.env.RUN_DURABLE_RUNTIME_TESTS === "true" &&
  Boolean(process.env.BACKEND_TEST_DATABASE_URL) &&
  Boolean(process.env.REDIS_URL ?? process.env.BACKEND_TEST_REDIS_URL);

const describeIfDurable = shouldRunDurableRuntimeIntegrationTests ? describe : describe.skip;

type DurableHelpers = typeof import("./durable-test-helpers.js");
type DurableTestContext = import("./durable-test-helpers.js").DurableTestContext;

describeIfDurable("durable runtime integration", () => {
  let context: DurableTestContext;
  let helpers: DurableHelpers;

  beforeAll(async () => {
    helpers = await import("./durable-test-helpers.js");
    const available = await helpers.shouldRunDurableRuntimeIntegrationTests();
    if (!available) {
      throw new Error("Durable runtime integration prerequisites are not available");
    }
    context = await helpers.openDurableTestContext();
  }, 30_000);

  afterAll(async () => {
    await helpers.closeDurableTestContext(context);
  }, 30_000);

  beforeEach(async () => {
    await helpers.resetDurableTestState(context);
  }, 30_000);

  it("persists queued jobs, billing snapshots, and unpublished outbox events on enqueue", async () => {
    const { jobs } = helpers.createDurableRuntimeForContext(context);
    const request = helpers.createDurableTestPipelineRequest();
    const plan = helpers.createDurableTestPlan(request);

    const queued = await Effect.runPromise(
      jobs.enqueueAtomic!(request, {
        plan,
        simulateCredits: true
      })
    );

    const jobRow = await context.postgres.db
      .selectFrom("jobs")
      .selectAll()
      .where("id", "=", queued.jobId)
      .executeTakeFirst();

    const outboxRow = await context.postgres.db
      .selectFrom("outbox_events")
      .selectAll()
      .where("aggregate_id", "=", queued.jobId)
      .executeTakeFirst();

    const billingRow = await context.postgres.db
      .selectFrom("billing_snapshots")
      .selectAll()
      .where("id", "=", "default")
      .executeTakeFirst();

    expect(jobRow).toBeDefined();
    expect(jobRow?.user_id).toBe("durable-test-user");
    expect(outboxRow).toBeDefined();
    expect(outboxRow?.published_at).toBeNull();
    expect(billingRow).toBeDefined();
  });

  it("relays outbox events into BullMQ and marks them published", async () => {
    const { jobs, relay, queue } = helpers.createDurableRuntimeForContext(context);
    const request = helpers.createDurableTestPipelineRequest();
    const plan = helpers.createDurableTestPlan(request);

    const queued = await Effect.runPromise(
      jobs.enqueueAtomic!(request, {
        plan,
        simulateCredits: true
      })
    );

    await relay.tick();

    const outboxRow = await context.postgres.db
      .selectFrom("outbox_events")
      .selectAll()
      .where("aggregate_id", "=", queued.jobId)
      .executeTakeFirst();

    const bullJob = await queue.getJob(queued.jobId);

    expect(outboxRow?.published_at).toBeTruthy();
    expect(bullJob?.executionId).toBe(queued.jobId);

    await queue.close();
  });

  it("survives API restart by reloading queued jobs from PostgreSQL", async () => {
    const runtimeA = helpers.createDurableRuntimeForContext(context);
    const request = helpers.createDurableTestPipelineRequest();
    const plan = helpers.createDurableTestPlan(request);

    const queued = await Effect.runPromise(
      runtimeA.jobs.enqueueAtomic!(request, {
        plan,
        simulateCredits: true
      })
    );

    await runtimeA.queue.close();

    const runtimeB = helpers.createDurableRuntimeForContext(context);
    const status = await Effect.runPromise(runtimeB.jobs.getJobStatus(queued.jobId));

    expect(status?.jobId).toBe(queued.jobId);
    expect(status?.status).toBe("queued");
    expect(status?.userId).toBe("durable-test-user");

    await runtimeB.queue.close();
  });

  it("reloads billing snapshots after restart", async () => {
    const userId = context.config.billingUserId!;
    const planId = context.config.billingPlanId!;
    const subscriptionId = `${userId}:${planId}:subscription`;

    context.billing.upsertSubscription({
      id: subscriptionId,
      userId,
      planId,
      status: "active",
      startedAt: new Date().toISOString()
    });

    await Effect.runPromise(
      helpers.saveBillingRepository(
        context.postgres.db,
        context.billingRepository,
        new Date().toISOString()
      )
    );

    const reloadedRepository = await helpers.reloadBillingRepository(context);

    expect(reloadedRepository.subscriptions.has(subscriptionId)).toBe(true);
  });

  it("reloads enqueue-time credit reservations before worker capture", async () => {
    const { randomUUID } = await import("node:crypto");
    const { createBillingRepository } = await import("@my-ai-orchestrator/payments");
    const { registerBackendBillingPlans } = await import("../../apps/backend/src/product/billing-bootstrap.js");
    const { reloadBillingRepositoryInto } = await import("../../apps/backend/src/infra/durable-store.js");
    const userId = context.config.billingUserId!;
    const planId = context.config.billingPlanId!;
    const generationCycleId = `generation:validation-post:${randomUUID()}`;

    for (const [key, plan] of createBillingRepository().plans) {
      context.billingRepository.plans.set(key, plan);
    }
    await Effect.runPromise(registerBackendBillingPlans(context.billing));
    context.billing.upsertSubscription({
      id: `${userId}:${planId}:subscription`,
      userId,
      planId,
      status: "active",
      startedAt: new Date().toISOString()
    });

    await Effect.runPromise(
      context.billing.startCycle({
        userId,
        planId,
        cycleId: `${userId}:${planId}:cycle:${randomUUID()}`,
        idempotencyKey: `worker-reload-test:${randomUUID()}`
      })
    );

    const reservation = await Effect.runPromise(
      context.billing.reserveGenerationCredits({
        userId,
        planId,
        generationCycleId,
        qualityMode: "balanced",
        retryCount: 3,
        idempotencyKey: `reserve:${generationCycleId}`,
        metadata: {
          pipelineName: "validation-post",
          contentType: "validation-post"
        }
      })
    );

    await Effect.runPromise(
      helpers.saveBillingRepository(
        context.postgres.db,
        context.billingRepository,
        new Date().toISOString()
      )
    );

    context.billingRepository.reservations.clear();

    await Effect.runPromise(reloadBillingRepositoryInto(context.postgres.db, context.billingRepository));

    const capture = await Effect.runPromise(
      context.billing.captureReservedCredits({
        reservationId: reservation.value.reservationId,
        idempotencyKey: `capture:test:${generationCycleId}`,
        metadata: {
          pipelineName: "validation-post",
          contentType: "validation-post",
          qualityMode: "balanced"
        }
      })
    );

    expect(capture.value.status).toBe("captured");
  });

  it("fans out execution events to multiple SSE subscribers", async () => {
    const executionId = "execution-sse-fanout";
    const subscriberA = context.redis.duplicate();
    const subscriberB = context.redis.duplicate();
    const receivedA: string[] = [];
    const receivedB: string[] = [];

    subscribeExecutionEvents(subscriberA, executionId, (event) => {
      receivedA.push(event.type);
    });
    subscribeExecutionEvents(subscriberB, executionId, (event) => {
      receivedB.push(event.type);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    await appendPersistedExecutionEvent(context.redis, {
      type: "progress",
      jobId: executionId,
      payload: {
        currentStep: "queued",
        stepIndex: 0,
        totalSteps: 2,
        percent: 0
      },
      occurredAt: new Date().toISOString()
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(receivedA).toEqual(["progress"]);
    expect(receivedB).toEqual(["progress"]);

    await subscriberA.quit();
    await subscriberB.quit();
  });

  it("stores execution idempotency in PostgreSQL and rejects fingerprint conflicts", async () => {
    const store = createPostgresExecutionIdempotencyStore(
      context.postgres.db,
      () => new Date("2026-06-14T12:00:00.000Z")
    );

    const response = {
      mode: "async" as const,
      jobId: "job-idempotent-1",
      status: "queued" as const,
      contentType: "validation-post",
      estimatedSteps: 2,
      createdAt: "2026-06-14T12:00:00.000Z"
    };

    await Effect.runPromise(
      store.save("durable-test-user", "idem-key-1", "fingerprint-a", response, response.jobId)
    );

    const cached = await Effect.runPromise(
      store.find("durable-test-user", "idem-key-1", "fingerprint-a")
    );

    expect(cached).toEqual(response);

    await expect(
      Effect.runPromise(store.find("durable-test-user", "idem-key-1", "fingerprint-b"))
    ).rejects.toThrow(/already used for a different execution/);
  });
});
