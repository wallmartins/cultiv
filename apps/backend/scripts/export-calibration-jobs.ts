#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { bootstrapBackendConfig } from "../src/config/config.js";
import { loadCalibrationEnvironment } from "./calibration/load-env.js";

const { Client } = pg;

const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

async function main(): Promise<void> {
  loadCalibrationEnvironment();
  const config = bootstrapBackendConfig({ loadEnvFile: false });
  const databaseUrl = process.env.DATABASE_URL ?? config.databaseUrl;

  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Set it in the environment or .env file.");
    process.exit(1);
  }

  const outPath = resolve(
    repoRoot,
    process.argv[2] ?? "tests/fixtures/billing/calibration-jobs-production.json"
  );
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  const result = await client.query<{ id: string; data: unknown }>(
    `SELECT id, data FROM jobs WHERE data->>'status' = 'done' ORDER BY created_at ASC`
  );
  await client.end();

  const jobs = result.rows.map((row) => ({
    id: row.id,
    ...(typeof row.data === "string" ? JSON.parse(row.data) : row.data)
  }));

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(jobs, null, 2)}\n`);

  console.log(`Exported ${jobs.length} completed job(s) to ${outPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
