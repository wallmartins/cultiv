import { Effect } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import { bootstrapBackendConfig } from "../config/config.js";
import { acquirePostgresPool, releasePostgresPool } from "../infra/postgres-bootstrap.js";
import type { DatabaseTables } from "../infra/postgres-tables.js";
import { createBackendProductServices, type BackendProductServices } from "../product.js";
import {
  computeConsistencyScore,
  computeTopicIndependenceScore,
  explainConsistency,
  resolveDeterministicFeatures
} from "../product/voice/deterministic-extraction.js";
import { STYLE_DEFINITION_HIGH, STYLE_DEFINITION_MEDIUM } from "../product/voice/voice-rebuild-derivation.js";
import { isWizardVoiceExample, resolveWizardTopicTag } from "../product/voice/wizard-voice-examples.js";

// Rebuilds one author's Voice Profile from the examples already in Postgres, in this process.
// The rebuild queue is in-memory, so drain() runs the pipeline here rather than handing it to the
// worker — which makes this the operator path for "the derivation changed, re-derive the profile"
// without minting a user token just to reach the HTTP route.
async function main() {
  const explain = process.argv.includes("--explain");
  const userId = process.argv.slice(2).find((argument) => !argument.startsWith("--"));

  if (!userId && !process.argv.includes("--list")) {
    console.error("Usage: voice:rebuild <userId>            # re-derive the profile");
    console.error("       voice:rebuild <userId> --explain  # why is the confidence what it is");
    console.error("       voice:rebuild --list              # application user ids, newest first");
    process.exit(1);
  }

  const config = bootstrapBackendConfig();

  if (!config.databaseUrl) {
    console.error("DATABASE_URL is required to rebuild a voice profile");
    process.exit(1);
  }

  if (!userId) {
    await listAuthors(config.databaseUrl);
    return;
  }

  const services = await Effect.runPromise(createBackendProductServices(config, { now: () => new Date() }));

  if (explain) {
    await explainConfidence(services, userId);
    return;
  }

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

// confidence = lowest(style, extraction, material, cap). When an author writes four good texts and
// still lands on medium, the useful answer is which of those four terms is binding — and, if it is
// style, which axis is dispersed. Printing the examples alongside keeps the numbers falsifiable.
async function explainConfidence(services: BackendProductServices, userId: string) {
  const screen = await Effect.runPromise(services.voice.getProfileScreen(userId));
  if (!screen) {
    console.error(`No voice profile found for ${userId}`);
    process.exit(1);
  }

  const all = await Effect.runPromise(services.database.voiceExamples.listByUser(userId));
  const active = all.filter((example) => example.state === "active");
  const wizard = active.filter(isWizardVoiceExample);

  console.info(`profile v${screen.profile.version} — confidence: ${screen.profile.confidence}`);
  console.info(`examples: ${all.length} total, ${active.length} active, ${wizard.length} wizard-sourced`);

  if (wizard.length === 0) {
    console.info("");
    console.info("No wizard-sourced examples, so no quantitative signals are built and the profile");
    console.info("falls back to the legacy count/diversity confidence.");
    return;
  }

  const features = wizard.map(resolveDeterministicFeatures);
  const consistency = computeConsistencyScore(features);
  const topicIndependence = computeTopicIndependenceScore(features, wizard.map(resolveWizardTopicTag));
  const styleDefinition = Math.min(consistency, topicIndependence);
  const quality = screen.quantitativeSignals?.extractionQuality;

  console.info("");
  console.info("scores:");
  console.info(`  consistency        ${consistency.toFixed(4)}`);
  console.info(`  topicIndependence  ${topicIndependence.toFixed(4)}`);
  console.info(
    `  styleDefinition    ${styleDefinition.toFixed(4)}  (the weaker one; high >= ${STYLE_DEFINITION_HIGH}, medium >= ${STYLE_DEFINITION_MEDIUM})`
  );

  console.info("");
  console.info("dispersion per axis (lower = more consistent):");
  for (const { key, dispersion } of explainConsistency(features)) {
    console.info(`  ${key.padEnd(20)} ${dispersion.toFixed(4)}`);
  }

  console.info("");
  console.info("ceilings:");
  console.info(`  style       ${band(styleDefinition)}`);
  console.info(
    `  extraction  ${quality?.reasoningExtracted && quality?.developmentExtracted ? "high" : "medium"}`
    + `  (reasoning: ${quality?.reasoningExtracted ?? "?"}, development: ${quality?.developmentExtracted ?? "?"})`
  );
  console.info(`  material    ${active.length >= 4 ? "high" : active.length >= 2 ? "medium" : "low"}  (${active.length} active)`);

  console.info("");
  console.info("examples:");
  wizard.forEach((example, index) => {
    const words = example.text.trim().split(/\s+/).filter(Boolean).length;
    console.info(`\n--- #${index + 1} [${resolveWizardTopicTag(example)}] ${words} words ---`);
    console.info(example.text.trim());
  });
}

function band(score: number): string {
  return score >= STYLE_DEFINITION_HIGH ? "high" : score >= STYLE_DEFINITION_MEDIUM ? "medium" : "low";
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
