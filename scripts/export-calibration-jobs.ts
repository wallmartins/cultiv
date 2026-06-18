#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Example:");
    console.error("  DATABASE_URL=postgresql://... tsx scripts/export-calibration-jobs.ts");
    process.exit(1);
  }

  const outPath = resolve(process.argv[2] ?? "tests/fixtures/billing/calibration-jobs-production.json");
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
