import { readdirSync } from "node:fs";
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
