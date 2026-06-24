import { Effect } from "effect";
import { Redis } from "ioredis";
import { buildOrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { PipelineRequest } from "@my-ai-orchestrator/contracts";
import {
  type BillingRepository
} from "@my-ai-orchestrator/payments";
import type { BackendConfig } from "../../apps/backend/src/config/config.js";
import { createPostgresDatabaseClient } from "../../apps/backend/src/infra/postgres-client.js";
import { resetSharedRedisClientForTests } from "../../apps/backend/src/infra/redis-client.js";
import { loadBillingRepository, saveBillingRepository } from "../../apps/backend/src/infra/durable-store.js";
import { drainBillingRepositoryPersistQueue } from "../../apps/backend/src/infra/postgres-billing-store.js";
import { createPersistingBillingService } from "../../apps/backend/src/product/billing/durable-billing.js";
import { registerBackendBillingPlans, seedUserBillingState } from "../../apps/backend/src/product/billing/billing-bootstrap.js";
import { createDurableJobRuntime } from "../../apps/backend/src/runtime/durable-job-runtime.js";
import { createExecutionQueue } from "../../apps/backend/src/runtime/execution-queue.js";
import { createOutboxRelay } from "../../apps/backend/src/runtime/outbox-relay.js";
import {
  backendTestDatabaseUrl,
  clearDurableRuntimeTables,
  closePostgresTestDatabase,
  isPostgresTestDatabaseAvailable,
  openPostgresTestDatabase,
  type PostgresTestContext
} from "../../apps/backend/tests/postgres-test-helpers.js";

export const durableTestRedisUrl =
  process.env.BACKEND_TEST_REDIS_URL ?? process.env.REDIS_URL ?? "redis://localhost:6379";
export const runDurableRuntimeTests = process.env.RUN_DURABLE_RUNTIME_TESTS === "true";

export interface DurableTestContext {
  readonly postgres: PostgresTestContext;
  readonly redis: Redis;
  readonly config: BackendConfig;
  readonly database: ReturnType<typeof createPostgresDatabaseClient>;
  readonly billingRepository: BillingRepository;
  readonly billing: ReturnType<typeof createPersistingBillingService>;
}

let cachedRedisAvailability: Promise<boolean> | undefined;

export function isDurableTestRedisAvailable(): Promise<boolean> {
  if (cachedRedisAvailability) {
    return cachedRedisAvailability;
  }

  cachedRedisAvailability = (async () => {
    const redis = new Redis(durableTestRedisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2_000
    });

    try {
      await redis.connect();
      await redis.ping();
      await redis.quit();
      return true;
    } catch {
      try {
        await redis.quit();
      } catch {
        return false;
      }
      return false;
    }
  })();

  return cachedRedisAvailability;
}

export async function shouldRunDurableRuntimeIntegrationTests(): Promise<boolean> {
  if (!runDurableRuntimeTests || !backendTestDatabaseUrl) {
    return false;
  }

  const [postgresReady, redisReady] = await Promise.all([
    isPostgresTestDatabaseAvailable(),
    isDurableTestRedisAvailable()
  ]);

  return postgresReady && redisReady;
}

export function createDurableTestConfig(
  databaseUrl: string,
  redisUrl: string,
  overrides: Partial<BackendConfig> = {}
): BackendConfig {
  return {
    environment: "test",
    executionMode: "async",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR",
    serviceName: "backend-durable-test",
    host: "127.0.0.1",
    port: 3000,
    version: "0.1.0",
    databaseUrl,
    redisUrl,
    allowInMemoryRuntime: false,
    billingUserId: "durable-test-user",
    billingPlanId: "free",
    executionWorkerConcurrency: 1,
    ...overrides
  } as BackendConfig;
}

export function createDurableTestPipelineRequest(
  overrides: Partial<PipelineRequest> = {}
): PipelineRequest {
  return {
    userId: "durable-test-user",
    pipelineType: "validation-post",
    contentType: "validation-post",
    briefing: {
      topic: "Durable runtime integration",
      keyPoints: ["postgres", "redis", "outbox"]
    },
    ...overrides
  } as PipelineRequest;
}

export function createDurableTestPlan(request: PipelineRequest = createDurableTestPipelineRequest()) {
  return buildOrchestrationPlan(request, {
    executionMode: "async",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR"
  });
}

export async function openDurableTestContext(
  configOverrides: Partial<BackendConfig> = {}
): Promise<DurableTestContext> {
  if (!backendTestDatabaseUrl) {
    throw new Error("BACKEND_TEST_DATABASE_URL is required for durable runtime integration tests");
  }

  const postgres = await openPostgresTestDatabase();
  const redis = new Redis(durableTestRedisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true
  });
  redis.on("error", () => undefined);
  await redis.connect();

  const config = createDurableTestConfig(backendTestDatabaseUrl, durableTestRedisUrl, configOverrides);
  const database = createPostgresDatabaseClient(postgres.db);
  const billingRepository = await Effect.runPromise(loadBillingRepository(postgres.db));
  const now = () => new Date("2026-06-14T12:00:00.000Z");
  const billing = createPersistingBillingService(postgres.db, billingRepository, now);

  await Effect.runPromise(registerBackendBillingPlans(billing));
  await Effect.runPromise(seedUserBillingState(billing, config, config.billingUserId!, now));
  await Effect.runPromise(saveBillingRepository(postgres.db, billingRepository, now().toISOString(), { allowDestructiveReplace: true }));
  await drainBillingRepositoryPersistQueue();

  return {
    postgres,
    redis,
    config,
    database,
    billingRepository,
    billing
  };
}

export async function closeDurableTestContext(context: DurableTestContext | undefined): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 100));

  if (context?.redis) {
    context.redis.on("error", () => undefined);
    context.redis.disconnect();
  }

  await resetSharedRedisClientForTests();
  await closePostgresTestDatabase(context?.postgres);
}

export async function resetDurableTestState(context: DurableTestContext): Promise<void> {
  await clearDurableRuntimeTables(context.postgres.db);
  await context.redis.flushdb();
  resetBillingRepositoryMaps(context.billingRepository);
  await Effect.runPromise(registerBackendBillingPlans(context.billing));
  await Effect.runPromise(
    seedUserBillingState(context.billing, context.config, context.config.billingUserId!, () => new Date())
  );
  await Effect.runPromise(
    saveBillingRepository(context.postgres.db, context.billingRepository, new Date().toISOString(), {
      allowDestructiveReplace: true
    })
  );
  await drainBillingRepositoryPersistQueue();
}

function resetBillingRepositoryMaps(repository: BillingRepository): void {
  repository.plans.clear();
  repository.subscriptions.clear();
  repository.usage.splice(0, repository.usage.length);
  repository.ledger.splice(0, repository.ledger.length);
  repository.topUpPackages.clear();
  repository.reservations.clear();
  repository.cycleStates.clear();
  repository.idempotency.clear();
}

export function createDurableRuntimeForContext(context: DurableTestContext) {
  const now = () => new Date("2026-06-14T12:00:00.000Z");
  const jobs = createDurableJobRuntime({
    config: context.config,
    database: context.database,
    postgres: context.postgres.db,
    redis: context.redis,
    billing: context.billing,
    billingRepository: context.billingRepository,
    now
  });
  const queue = createExecutionQueue(context.config);
  const relay = createOutboxRelay({
    db: context.postgres.db,
    redis: context.redis,
    queue,
    now,
    intervalMs: 50
  });

  return { jobs, queue, relay, now };
}

export async function closeDurableRuntime(
  runtime: ReturnType<typeof createDurableRuntimeForContext>
): Promise<void> {
  runtime.relay.stop();
  await runtime.queue.close();
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
}

export async function reloadBillingRepository(context: DurableTestContext) {
  const { loadPostgresBillingRepository } = await import(
    "../../apps/backend/src/infra/postgres-billing-store.js"
  );
  return Effect.runPromise(loadPostgresBillingRepository(context.postgres.db));
}

export { saveBillingRepository };
