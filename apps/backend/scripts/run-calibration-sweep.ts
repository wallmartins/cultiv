#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";
import type { GenerationLengthTier, QualityMode, RhetoricalMode } from "@my-ai-orchestrator/contracts";
import { CALIBRATION_BRIEFINGS } from "./calibration/briefings.js";
import { loadCalibrationEnvironment } from "./calibration/load-env.js";
import { resolveCalibrationRepoPath } from "./calibration/resolve-repo-path.js";
import {
  countSweepRuns,
  resolveSweepProfile,
  type CalibrationSweepCell
} from "./calibration/sweep-matrix.js";

const { Client } = pg;

interface SweepManifestEntry {
  readonly cellId: string;
  readonly runIndex: number;
  readonly rhetoricalMode: RhetoricalMode;
  readonly lengthTier: GenerationLengthTier;
  readonly qualityMode: QualityMode;
  readonly expectedPlanSignature: string;
  readonly jobId?: string;
  readonly status: "pending" | "queued" | "done" | "failed" | "skipped";
  readonly error?: string;
}

// Sweep briefings are keyed by descriptive scenario labels (pre-F1 intents); one representative
// briefing per rhetorical mode keeps the sweep exercising realistic payloads.
const BRIEFING_KEY_BY_MODE: Readonly<Record<RhetoricalMode, string>> = {
  expound: "explain-deeply",
  narrate: "tell-story",
  argue: "document-decision",
  instruct: "explain-deeply",
  promote: "update-subscribers"
};

interface SweepManifest {
  readonly sweepId: string;
  readonly profileId: string;
  readonly userId: string;
  readonly baseUrl: string;
  readonly startedAt: string;
  readonly entries: SweepManifestEntry[];
}

function parseArgs(argv: readonly string[]) {
  const dryRun = argv.includes("--dry-run");
  const profileId = argv.includes("--profile")
    ? (argv[argv.indexOf("--profile") + 1] ?? "full")
    : "tier-variance";
  const repeats = argv.includes("--repeats")
    ? Number(argv[argv.indexOf("--repeats") + 1] ?? "3")
    : 3;
  const delayMs = argv.includes("--delay-ms")
    ? Number(argv[argv.indexOf("--delay-ms") + 1] ?? "2000")
    : 2000;
  const pollMs = argv.includes("--poll-ms") ? Number(argv[argv.indexOf("--poll-ms") + 1] ?? "5000") : 5000;
  const timeoutMs = argv.includes("--timeout-ms")
    ? Number(argv[argv.indexOf("--timeout-ms") + 1] ?? "900000")
    : 900_000;
  const outPath = argv.includes("--out")
    ? resolve(argv[argv.indexOf("--out") + 1] ?? "calibration-sweep-manifest.json")
    : resolveCalibrationRepoPath("docs/superpowers/reports/calibration-sweep-manifest.json");

  return { dryRun, profileId, repeats, delayMs, pollMs, timeoutMs, outPath };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(
      `Missing required environment variable: ${name} (set in ~/app/.env or export before running)`
    );
    process.exit(1);
  }
  return value;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function fetchJson(
  baseUrl: string,
  token: string,
  path: string,
  body: unknown
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: response.status, json };
}

async function pollJobDone(
  databaseUrl: string,
  jobId: string,
  pollMs: number,
  timeoutMs: number
): Promise<"done" | "failed"> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const started = Date.now();

  try {
    while (Date.now() - started < timeoutMs) {
      const result = await client.query<{ status: string | null }>(
        `SELECT data->>'status' AS status FROM jobs WHERE id = $1`,
        [jobId]
      );
      const status = result.rows[0]?.status;
      if (status === "done") {
        return "done";
      }
      if (status === "failed") {
        return "failed";
      }
      await sleep(pollMs);
    }

    throw new Error(`Timed out waiting for job ${jobId}`);
  } finally {
    await client.end();
  }
}

async function runCell(args: {
  readonly baseUrl: string;
  readonly token: string;
  readonly databaseUrl: string;
  readonly cell: CalibrationSweepCell;
  readonly runIndex: number;
  readonly sweepId: string;
  readonly pollMs: number;
  readonly timeoutMs: number;
}): Promise<SweepManifestEntry> {
  const baseEntry: SweepManifestEntry = {
    cellId: args.cell.id,
    runIndex: args.runIndex,
    rhetoricalMode: args.cell.rhetoricalMode,
    lengthTier: args.cell.lengthTier,
    qualityMode: args.cell.qualityMode,
    expectedPlanSignature: args.cell.expectedPlanSignature,
    status: "pending"
  };

  const previewBody = {
    rhetoricalMode: args.cell.rhetoricalMode,
    scope: { lengthTier: args.cell.lengthTier },
    qualityMode: args.cell.qualityMode,
    language: "pt-BR",
    briefing: CALIBRATION_BRIEFINGS[BRIEFING_KEY_BY_MODE[args.cell.rhetoricalMode]]
  };

  const preview = await fetchJson(args.baseUrl, args.token, "/api/generation-preview", previewBody);
  if (preview.status !== 200) {
    return {
      ...baseEntry,
      status: "failed",
      error: `preview ${preview.status}: ${JSON.stringify(preview.json)}`
    };
  }

  const previewJson = preview.json as {
    pricingSnapshot?: { quoteId?: string };
  };
  const quoteId = previewJson.pricingSnapshot?.quoteId;
  if (!quoteId) {
    return { ...baseEntry, status: "failed", error: "preview missing quoteId" };
  }

  const executeBody = {
    ...previewBody,
    quoteId,
    idempotencyKey: `calibration:${args.sweepId}:${args.cell.id}:${args.runIndex}`,
    context: {
      calibrationSweep: {
        sweepId: args.sweepId,
        cellId: args.cell.id,
        runIndex: args.runIndex,
        profile: "option-b-viability"
      }
    }
  };

  const execute = await fetchJson(args.baseUrl, args.token, "/me/executions/run", executeBody);
  if (execute.status !== 200 && execute.status !== 202) {
    return {
      ...baseEntry,
      status: "failed",
      error: `execute ${execute.status}: ${JSON.stringify(execute.json)}`
    };
  }

  const executeJson = execute.json as { jobId?: string; status?: string };
  const jobId = executeJson.jobId;
  if (!jobId) {
    return { ...baseEntry, status: "failed", error: "execute missing jobId" };
  }

  if (executeJson.status === "queued" || execute.status === 202) {
    const finalStatus = await pollJobDone(args.databaseUrl, jobId, args.pollMs, args.timeoutMs);
    return {
      ...baseEntry,
      jobId,
      status: finalStatus === "done" ? "done" : "failed",
      error: finalStatus === "failed" ? "job failed" : undefined
    };
  }

  return { ...baseEntry, jobId, status: "done" };
}

async function main(): Promise<void> {
  const { dryRun, profileId, repeats, delayMs, pollMs, timeoutMs, outPath } = parseArgs(process.argv.slice(2));
  const profile = resolveSweepProfile(profileId, repeats);
  const totalRuns = countSweepRuns(profile.cells);
  const baseUrl = (process.env.CALIBRATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
  const sweepId = process.env.CALIBRATION_SWEEP_ID ?? `sweep-${new Date().toISOString().replace(/[:.]/g, "-")}`;

  if (!dryRun) {
    loadCalibrationEnvironment();
  }

  const userId = process.env.CALIBRATION_USER_ID ?? "(from token)";

  console.log(`Calibration sweep: ${profile.id}`);
  console.log(profile.description);
  console.log(`Cells: ${profile.cells.length} | Runs: ${totalRuns} | Base URL: ${baseUrl}`);
  console.log(`User: ${userId} | Sweep ID: ${sweepId}`);

  if (dryRun) {
    for (const cell of profile.cells) {
      for (let runIndex = 0; runIndex < cell.repeats; runIndex += 1) {
        console.log(
          `[dry-run] ${cell.id} #${runIndex + 1} → ${cell.expectedPlanSignature} (${cell.qualityMode})`
        );
      }
    }
    return;
  }

  const token = requireEnv("CALIBRATION_ACCESS_TOKEN");
  const databaseUrl = requireEnv("DATABASE_URL");

  const manifest: SweepManifest = {
    sweepId,
    profileId: profile.id,
    userId,
    baseUrl,
    startedAt: new Date().toISOString(),
    entries: []
  };

  let completed = 0;
  for (const cell of profile.cells) {
    for (let runIndex = 0; runIndex < cell.repeats; runIndex += 1) {
      completed += 1;
      console.log(`[${completed}/${totalRuns}] ${cell.id} run ${runIndex + 1}/${cell.repeats}`);

      try {
        const entry = await runCell({
          baseUrl,
          token,
          databaseUrl,
          cell,
          runIndex,
          sweepId,
          pollMs,
          timeoutMs
        });
        manifest.entries.push(entry);
        console.log(`  → ${entry.status}${entry.jobId ? ` (${entry.jobId})` : ""}${entry.error ? ` — ${entry.error}` : ""}`);
      } catch (error) {
        manifest.entries.push({
          cellId: cell.id,
          runIndex,
          rhetoricalMode: cell.rhetoricalMode,
          lengthTier: cell.lengthTier,
          qualityMode: cell.qualityMode,
          expectedPlanSignature: cell.expectedPlanSignature,
          status: "failed",
          error: error instanceof Error ? error.message : String(error)
        });
      }

      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
      await sleep(delayMs);
    }
  }

  console.log(`\nManifest written to ${outPath}`);
  console.log("Next steps:");
  console.log(`  DATABASE_URL=... pnpm billing:export-jobs docs/superpowers/reports/calibration-jobs-sweep.json`);
  console.log(`  pnpm billing:calibrate docs/superpowers/reports/calibration-jobs-sweep.json --report docs/superpowers/reports/calibration-after-sweep.md`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
