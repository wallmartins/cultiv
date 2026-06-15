import { Effect } from "effect";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import { getPostgresDatabase } from "../infra/postgres-client.js";
import { getSharedRedisClient } from "../infra/redis-client.js";
import { createDurableJobRuntime } from "./durable-job-runtime.js";
import { createExecutionQueue } from "./execution-queue.js";
import { createOutboxRelay } from "./outbox-relay.js";
import { createBackendJobStoreService } from "../jobs/job-store.js";
import type { BackendJobStoreServiceContract } from "../jobs/job-store.js";
import type { BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { DurableJobRuntime } from "./durable-job-runtime.js";

export type BackendJobRuntime = BackendJobStoreServiceContract & {
  readonly enqueueAtomic?: DurableJobRuntime["enqueueAtomic"];
  readonly getRuntimePayload?: DurableJobRuntime["getRuntimePayload"];
};

export interface BackendRuntimeBundle {
  readonly mode: "durable" | "memory";
  readonly jobs: BackendJobRuntime;
  readonly billing: BillingServiceContract;
  readonly relay?: import("./outbox-relay.js").OutboxRelay;
  readonly queue?: import("./execution-queue.js").ExecutionQueue;
  readonly start: () => void;
  readonly stop: () => Promise<void>;
}

export function resolveBackendRuntimeMode(config: BackendConfig): "durable" | "memory" {
  if (config.allowInMemoryRuntime) {
    return "memory";
  }

  if (config.databaseUrl && config.redisUrl) {
    return "durable";
  }

  return "memory";
}

export function createBackendRuntimeBundle(options: {
  readonly config: BackendConfig;
  readonly services: BackendProductServices;
  readonly now: () => Date;
}): Effect.Effect<BackendRuntimeBundle, never> {
  return Effect.gen(function* () {
    const mode = resolveBackendRuntimeMode(options.config);

    if (mode === "memory") {
      const jobs = yield* createBackendJobStoreService();
      return {
        mode,
        jobs,
        billing: options.services.billing,
        start: () => undefined,
        stop: async () => undefined
      };
    }

    const postgres = getPostgresDatabase(options.services.rawDatabase);
    if (!postgres) {
      return yield* Effect.die(new Error("Durable runtime requires PostgreSQL client"));
    }

    const redis = getSharedRedisClient(options.config);
    const queue = createExecutionQueue(options.config);
    const durableJobs = createDurableJobRuntime({
      config: options.config,
      database: options.services.database,
      postgres,
      redis,
      billing: options.services.billing,
      billingRepository: options.services.billingRepository,
      now: options.now
    });
    const relay = createOutboxRelay({
      db: postgres,
      redis,
      queue,
      now: options.now
    });

    return {
      mode,
      jobs: durableJobs,
      billing: options.services.billing,
      relay,
      queue,
      start: () => relay.start(),
      stop: async () => {
        relay.stop();
        await queue.close();
      }
    };
  });
}
