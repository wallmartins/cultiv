import { Effect } from "effect";
import { bootstrapBackendConfig } from "../config/config.js";
import { createBackendProductServices } from "../product.js";
import { createBackendRuntimeBundle } from "../runtime/create-runtime-bundle.js";
import { createBackendMemoryBundleService } from "../memory/memory.js";
import { createBackendProviderTransport } from "../execution/pipeline/provider-transport.js";
import { getPostgresDatabase } from "../infra/postgres-client.js";
import { reloadBillingRepositoryInto } from "../infra/durable-store.js";
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
    const payload = await Effect.runPromise(runtime.jobs.getRuntimePayload!(executionId));
    if (!payload?.plan) {
      return;
    }

    if (postgres) {
      await Effect.runPromise(reloadBillingRepositoryInto(postgres, services.billingRepository));
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
  });

  console.info("Backend execution worker started");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
