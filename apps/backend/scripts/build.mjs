import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import * as esbuild from "esbuild";

const external = [
  "pg",
  "pg-native",
  "ioredis",
  "bullmq",
  "dotenv",
  "effect",
  "hono",
  "@hono/node-server",
  "kysely"
];

const migrationDir = "src/infra/migrations";
const migrationEntries = readdirSync(migrationDir)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => join(migrationDir, file));

rmSync("dist", { recursive: true, force: true });

await esbuild.build({
  entryPoints: [
    "src/cli/main.ts",
    "src/cli/worker-main.ts",
    "src/cli/migrate.ts",
    "src/cli/rotate-voice-protection-key.ts",
    "src/cli/billing-activate.ts"
  ],
  outdir: "dist",
  outbase: "src",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  external,
  sourcemap: true,
  logLevel: "info"
});

await esbuild.build({
  entryPoints: [
    "scripts/export-calibration-jobs.ts",
    "scripts/run-calibration-sweep.ts",
    "scripts/analyze-calibration-option-b.ts",
    "scripts/compositor-parity-harness.ts",
    "scripts/step-planner-cogs-harness.ts",
    "scripts/step-planner-smoke-harness.ts"
  ],
  outdir: "dist/scripts",
  outbase: "scripts",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  external,
  sourcemap: true,
  logLevel: "info"
});

await esbuild.build({
  entryPoints: migrationEntries,
  outdir: "dist/infra/migrations",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  external,
  sourcemap: true,
  logLevel: "info"
});

const compiledMigrationNames = new Set(
  readdirSync("dist/infra/migrations")
    .filter((file) => file.endsWith(".js") && !file.endsWith(".js.map"))
    .map((file) => file.replace(/\.js$/, ""))
);
const sourceMigrationNames = migrationEntries.map((entry) =>
  entry.replace(/^.*\//, "").replace(/\.ts$/, "")
);

for (const migrationName of compiledMigrationNames) {
  if (!sourceMigrationNames.includes(migrationName)) {
    throw new Error(`Stale compiled migration artifact: ${migrationName}.js`);
  }
}

for (const migrationName of sourceMigrationNames) {
  if (!compiledMigrationNames.has(migrationName)) {
    throw new Error(`Missing compiled migration artifact: ${migrationName}.js`);
  }
}
