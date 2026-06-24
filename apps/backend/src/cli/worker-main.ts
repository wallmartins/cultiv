import { Effect } from "effect";
import { bootstrapBackendConfig } from "../config/config.js";
import { createBackendProductServices } from "../product.js";
import { createBackendRuntimeBundle } from "../runtime/create-runtime-bundle.js";
import { createBackendMemoryBundleService } from "../memory/memory.js";
import { createBackendProviderTransport } from "../execution/pipeline/provider-transport.js";
import { getPostgresDatabase } from "../infra/postgres-client.js";
import { reloadBillingRepositoryForUserInto } from "../infra/durable-store.js";
import { processQueuedJob } from "../jobs/worker-job.js";

async function main() {
  const config = bootstrapBackendConfig();
  const now = () => new Date();

  const services = await Effect.runPromise(createBackendProductServices(config, { now }));
  const memory = await Effect.runPromise(
    createBackendMemoryBundleService({
      database: services.database,
      namespace: config.serviceName
    })
  );
  const runtime = await Effect.runPromise(createBackendRuntimeBundle({ config, services, now }));

  if (runtime.mode !== "durable" || !runtime.queue || !runtime.jobs.getRuntimePayload) {
    throw new Error("Worker process requires durable runtime with DATABASE_URL and REDIS_URL");
  }

  runtime.start();

  const providerTransport = createBackendProviderTransport(config);
  const postgres = getPostgresDatabase(services.rawDatabase);
  const worker = runtime.queue.createWorker(async ({ executionId }) => {
    const claimed = await Effect.runPromise(runtime.jobs.claimQueuedJob(executionId));
    if (!claimed) {
      return;
    }

    const payload = await Effect.runPromise(runtime.jobs.getRuntimePayload!(executionId));
    if (!payload?.plan) {
      return;
    }

    if (postgres && payload.userId) {
      await Effect.runPromise(
        reloadBillingRepositoryForUserInto(postgres, services.billingRepository, payload.userId)
      );
    }

    await processQueuedJob(
      {
        config,
        jobStore: runtime.jobs,
        now,
        memory,
        services: {
          ...services,
          billing: runtime.billing
        },
        providerTransport
      },
      {
        jobId: executionId,
        request: payload.request,
        plan: payload.plan,
        pricingEnvelope: payload.pricingEnvelope,
        simulateCredits: payload.simulateCredits,
        creditReservationId: payload.creditReservationId
      }
    );
  });

  void worker.on("failed", (job, error) => {
    console.error("Worker execution failed", {
      executionId: job?.id,
      reason: error.message
    });

    if (!job?.id) {
      return;
    }

    const maxAttempts = job.opts.attempts ?? 3;
    if (job.attemptsMade < maxAttempts) {
      return;
    }

    void Effect.runPromise(
      runtime.jobs.failJob(job.id, {
        message: error.message,
        step: null
      })
    ).catch((failError) => {
      console.error("Failed to mark exhausted worker job as failed", {
        executionId: job.id,
        reason: failError instanceof Error ? failError.message : String(failError)
      });
    });
  });

  console.info("Backend execution worker started");

  const gracefulShutdown = async (signal: string) => {
    console.info(`${signal} received, shutting down worker gracefully...`);
    const forceExit = setTimeout(() => {
      console.warn("Worker shutdown timed out, forcing exit");
      process.exit(1);
    }, 15000);

    try {
      await worker.close();
      await runtime.stop();
      clearTimeout(forceExit);
      console.info("Worker shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Worker shutdown failed:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
