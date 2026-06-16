import { Effect } from "effect";
import { activateSubscription } from "@my-ai-orchestrator/payments";
import { bootstrapBackendConfig } from "../config/config.js";
import { registerBackendBillingPlans } from "../product/billing/billing-bootstrap.js";
import { createBackendProductServices } from "../product/core/services.js";

const usage = `Usage:
  pnpm --filter @my-ai-orchestrator/backend billing:activate -- --user-id <uuid> [--plan-id pro|free]

Activates a billing subscription and opens the credit cycle when missing.
Requires DATABASE_URL and a built backend (node dist/cli/billing-activate.js).
`;

function readFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    return undefined;
  }

  return value;
}

async function main() {
  const userId = readFlag("--user-id");
  const planId = readFlag("--plan-id") ?? "pro";

  if (!userId) {
    console.error(usage);
    process.exit(1);
  }

  const config = bootstrapBackendConfig();
  if (!config.databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const services = await Effect.runPromise(createBackendProductServices(config));
  await Effect.runPromise(registerBackendBillingPlans(services.billing));

  const entitlement = await Effect.runPromise(
    activateSubscription(services.billing, {
      userId,
      planId,
      now: () => new Date(),
      idempotencyNamespace: "billing-activate-cli"
    })
  );

  console.log(
    JSON.stringify(
      {
        userId: entitlement.userId,
        planId: entitlement.planId,
        tier: entitlement.tier,
        status: entitlement.status,
        activeCycleId: entitlement.activeCycleId,
        availableCredits: entitlement.wallet.availableCredits
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
