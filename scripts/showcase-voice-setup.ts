#!/usr/bin/env tsx
import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { bootstrapBackendConfig } from "../apps/backend/src/config/config.js";
import { createBackendProductServices } from "../apps/backend/src/product/core/services.js";
import { createBackendTestAuthorizationHeader } from "../apps/backend/src/auth/index.js";

const defaultSubject = "showcase-cultiv-hitl";

const usage = `Usage:
  pnpm showcase:voice-setup [--subject showcase-cultiv-hitl]

Creates (or reuses) an application user, grants voice-training consent,
activates the dev billing plan on the running backend, and prints a Bearer
token for Bruno (Authorization header).

Requires PostgreSQL reachable at DATABASE_URL (same as pnpm dev).
Start pnpm dev before running this script so billing activation applies to
the live backend process (billing is in-memory).
`;

async function activateShowcaseBilling(
  config: ReturnType<typeof bootstrapBackendConfig>,
  authorization: string
): Promise<void> {
  const response = await fetch(`http://localhost:${config.port}/dev/showcase/billing-activate`, {
    method: "POST",
    headers: { authorization }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`billing activation failed (${response.status}): ${body}`);
  }

  const result = (await response.json()) as {
    readonly planId?: string | null;
    readonly availableCredits?: number;
  };

  console.log(
    `billing: plan=${result.planId ?? "none"} credits=${result.availableCredits ?? 0}`
  );
}

function printBrunoVariables(config: ReturnType<typeof bootstrapBackendConfig>, authorization: string) {
  console.log("Showcase voice setup complete.\n");
  console.log(`baseUrl: http://localhost:${config.port}`);
  console.log("\nBruno, set collection variables:");
  console.log(`  baseUrl = http://localhost:${config.port}`);
  console.log(`  authorization = ${authorization}`);
  console.log("\nNext:");
  console.log("  1. docs/live/issues/04-showcase-voice-profile-setup.md");
  console.log("  2. docs/live/issues/04-showcase-generation-guide.md");
}

async function main() {
  const subject = process.argv.includes("--subject")
    ? process.argv[process.argv.indexOf("--subject") + 1]
    : defaultSubject;

  if (!subject || subject.startsWith("--")) {
    console.error(usage);
    process.exit(1);
  }

  const config = bootstrapBackendConfig();

  if (!config.databaseUrl) {
    console.error(
      "DATABASE_URL is not set. Add it to .env (see docker compose postgres in the repo root)."
    );
    process.exit(1);
  }

  const authorization = createBackendTestAuthorizationHeader({
    userId: subject,
    subject
  });

  try {
    const services = await Effect.runPromise(
      createBackendProductServices(config, {
        now: () => new Date()
      })
    );

    const existing = await Effect.runPromise(services.users.findByExternalSubject(subject));
    const user =
      existing ??
      (await Effect.runPromise(
        services.users.create({
          id: randomUUID(),
          externalSubject: subject,
          status: "active"
        })
      ));

    await Effect.runPromise(services.voiceConsent.grantConsent(user.id));

    console.log(`externalSubject: ${subject}`);
    console.log(`userId: ${user.id}`);

    try {
      await activateShowcaseBilling(config, authorization);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("\nWarning: could not activate billing on the running backend.");
      console.warn(message);
      console.warn("Start pnpm dev and run pnpm showcase:voice-setup again before generating text.");
    }

    printBrunoVariables(config, authorization);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("Voice setup failed while connecting to the database.\n");
    console.error(message);
    console.error("\nChecklist:");
    console.error("  1. docker compose up -d postgres");
    console.error("  2. pnpm --filter @my-ai-orchestrator/backend migrate (if first run)");
    console.error("  3. DATABASE_URL in .env matches the running Postgres");
    console.error("\nBearer token for Bruno (user is provisioned on first /me call if missing):");
    console.log(`\n  authorization = ${authorization}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
