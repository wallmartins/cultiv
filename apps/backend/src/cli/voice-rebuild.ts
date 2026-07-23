import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import { bootstrapBackendConfig } from "../config/config.js";
import { acquirePostgresPool, releasePostgresPool } from "../infra/postgres-bootstrap.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { createBackendProductServices } from "../product.js";

// Rebuilds one author's Voice Profile from the examples already in Postgres, in this process.
// The rebuild queue is in-memory, so drain() runs the pipeline here rather than handing it to the
// worker — which makes this the operator path for "the derivation changed, re-derive the profile"
// without minting a user token just to reach the HTTP route.
async function main() {
  const userId = process.argv[2];

  if (!userId || (userId.startsWith("--") && userId !== "--list")) {
    console.error("Usage: voice:rebuild <userId>");
    console.error("       voice:rebuild --list    # ids with a voice profile, newest first");
    process.exit(1);
  }

  const config = bootstrapBackendConfig();

  if (!config.databaseUrl) {
    console.error("DATABASE_URL is required to rebuild a voice profile");
    process.exit(1);
  }

  if (userId === "--list") {
    await listAuthors(config.databaseUrl);
    return;
  }

  const services = await Effect.runPromise(createBackendProductServices(config, { now: () => new Date() }));

  const before = await Effect.runPromise(services.voice.getProfileScreen(userId));
  if (!before) {
    console.error(`No voice profile found for ${userId}`);
    process.exit(1);
  }

  console.info("before:", summarize(before));

  await Effect.runPromise(services.voiceRebuild.schedule(userId));
  await Effect.runPromise(services.voiceRebuild.drain(userId));

  const after = await Effect.runPromise(services.voice.getProfileScreen(userId));
  console.info("after: ", after ? summarize(after) : "(profile disappeared)");

  if (after?.diagnostics.pendingRebuild.status === "failed") {
    console.error("Rebuild failed — the previous snapshot is still active. See diagnostics.summary above.");
    process.exit(1);
  }
}

// Saves an operator the psql-inside-docker detour: this process already holds DATABASE_URL, and
// application_users has no email column — external_subject is the Auth0 `sub`.
async function listAuthors(databaseUrl: string) {
  const pool = await Effect.runPromise(acquirePostgresPool(databaseUrl));

  try {
    const db = new Kysely<DatabaseTables>({ dialect: new PostgresDialect({ pool }) });
    const rows = await db
      .selectFrom("application_users")
      .select(["id", "external_subject", "status", "created_at"])
      .where("deleted_at", "is", null)
      .orderBy("created_at", "desc")
      .limit(20)
      .execute();

    if (rows.length === 0) {
      console.info("No application users found.");
      return;
    }

    console.table(rows);
  } finally {
    await Effect.runPromise(releasePostgresPool(pool));
  }
}

function summarize(screen: {
  readonly profile: { readonly version: number; readonly confidence: string };
  readonly diagnostics: {
    readonly reasonCodes: readonly string[];
    readonly summary?: string | undefined;
    readonly pendingRebuild: { readonly status: string };
  };
}) {
  return {
    version: screen.profile.version,
    confidence: screen.profile.confidence,
    reasonCodes: screen.diagnostics.reasonCodes,
    rebuild: screen.diagnostics.pendingRebuild.status,
    summary: screen.diagnostics.summary
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
