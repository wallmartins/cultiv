import { Effect } from "effect";
import { sweepLapsedSubscriptions } from "@my-ai-orchestrator/payments";
import { bootstrapBackendConfig } from "../config/config.js";
import { createBackendProductServices } from "../product/core/services.js";

const usage = `Usage:
  pnpm --filter @my-ai-orchestrator/backend billing:lifecycle-sweep

Materializes lazy status transitions (trialing/canceled -> lapsed) into billing_subscriptions
and logs end-of-window notices. Meant to run periodically (Railway cron); the entitlement
read-path already derives the effective status lazily — this just keeps the column coherent.
Requires DATABASE_URL and a built backend (node dist/cli/billing-lifecycle-sweep.js).
`;

async function main() {
  const config = bootstrapBackendConfig();
  if (!config.databaseUrl) {
    console.error(usage);
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const services = await Effect.runPromise(createBackendProductServices(config));

  const results = sweepLapsedSubscriptions(services.billingRepository, {
    now: () => new Date(),
    onLapse: ({ subscription, previousStatus }) => {
      // ponytail: notice stub — um engine de e-mail/avisos real substitui este log (fora de escopo aqui).
      console.log(
        `[billing-lifecycle-sweep] ${subscription.userId}:${subscription.planId} ${previousStatus} -> ${subscription.status}`
      );
    }
  });

  for (const { subscription } of results) {
    services.billing.upsertSubscription(subscription);
  }

  console.log(JSON.stringify({ swept: results.length }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
