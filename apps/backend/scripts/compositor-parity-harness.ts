#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";
import { Effect } from "effect";
import { resolveGenerationTarget } from "../src/product/generation/resolve-generation-target.js";
import { planGeneration } from "../src/product/generation/compositor/compositor-planner.js";
import { loadCalibrationEnvironment } from "./calibration/load-env.js";
import { resolveCalibrationRepoPath } from "./calibration/resolve-repo-path.js";
import {
  COMPOSITOR_PARITY_FIXTURES,
  type CompositorParityFixture
} from "./compositor/parity-fixtures.js";

const { Client } = pg;

interface DryPlanComparison {
  readonly fixtureId: string;
  readonly label: string;
  readonly legacyContentType: string;
  readonly compositorPlanSignature: string;
  readonly legacyStepCount: null;
  readonly compositorStepCount: number;
  readonly compositorStepNames: readonly string[];
  readonly expressionProfile: string;
  readonly planSignatureMatchesExpectation: boolean;
}

interface HttpRunResult {
  readonly mode: "legacy" | "compositor";
  readonly fixtureId: string;
  readonly jobId?: string;
  readonly status: "done" | "failed" | "skipped" | "preview-only";
  readonly usdCost?: number;
  readonly stepCount?: number;
  readonly planSignature?: string;
  readonly legacyContentType?: string;
  readonly error?: string;
}

function parseArgs(argv: readonly string[]) {
  const dryRunOnly = argv.includes("--dry-run");
  const executeHttp = argv.includes("--execute");
  const outPath = argv.includes("--out")
    ? resolveCalibrationRepoPath(argv[argv.indexOf("--out") + 1] ?? "docs/superpowers/reports/compositor-parity-report.md")
    : resolveCalibrationRepoPath("docs/superpowers/reports/compositor-parity-report.md");

  return { dryRunOnly, executeHttp, outPath };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function compareFixturePlans(fixture: CompositorParityFixture): DryPlanComparison {
  const legacy = Effect.runSync(
    resolveGenerationTarget({
      intent: fixture.intent,
      scope: fixture.scope,
      compositorEnabled: false,
      qualityMode: fixture.qualityMode
    })
  );
  const compositorPlan = planGeneration({
    intent: fixture.intent,
    scope: fixture.scope,
    qualityMode: fixture.qualityMode
  });

  return {
    fixtureId: fixture.id,
    label: fixture.label,
    legacyContentType: legacy.contentTypeId,
    compositorPlanSignature: compositorPlan.planSignature,
    legacyStepCount: null,
    compositorStepCount: compositorPlan.steps.length,
    compositorStepNames: compositorPlan.steps.map((step) => step.name),
    expressionProfile: compositorPlan.parameters.expressionProfile,
    planSignatureMatchesExpectation:
      compositorPlan.planSignature === fixture.expectedCompositorPlanSignature &&
      legacy.contentTypeId === fixture.expectedLegacyContentType &&
      compositorPlan.parameters.expressionProfile === fixture.expectedExpressionProfile
  };
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
): Promise<{ status: "done" | "failed"; data?: Record<string, unknown> }> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const started = Date.now();

  try {
    while (Date.now() - started < timeoutMs) {
      const result = await client.query<{ data: Record<string, unknown> | null }>(
        `SELECT data FROM jobs WHERE id = $1`,
        [jobId]
      );
      const data = result.rows[0]?.data ?? undefined;
      const status = typeof data?.status === "string" ? data.status : null;
      if (status === "done") {
        return { status: "done", data };
      }
      if (status === "failed") {
        return { status: "failed", data };
      }
      await sleep(pollMs);
    }

    throw new Error(`Timed out waiting for job ${jobId}`);
  } finally {
    await client.end();
  }
}

function readUsdCost(jobData: Record<string, unknown> | undefined): number | undefined {
  const result = jobData?.result;
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const metadata = (result as { metadata?: Record<string, unknown> }).metadata;
  const telemetry = metadata?.telemetry;
  if (!telemetry || typeof telemetry !== "object") {
    return undefined;
  }

  const cost = (telemetry as { cost?: { estimatedUsdCost?: number } }).cost?.estimatedUsdCost;
  return typeof cost === "number" ? cost : undefined;
}

function readPlanSignature(jobData: Record<string, unknown> | undefined): string | undefined {
  const result = jobData?.result;
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const metadata = (result as { metadata?: Record<string, unknown> }).metadata;
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const direct = metadata.planSignature;
  if (typeof direct === "string") {
    return direct;
  }

  const telemetry = metadata.telemetry;
  if (telemetry && typeof telemetry === "object") {
    const pricing = (telemetry as { pricing?: { planSignature?: string } }).pricing?.planSignature;
    if (typeof pricing === "string") {
      return pricing;
    }
  }

  return undefined;
}

async function runHttpFixture(args: {
  readonly baseUrl: string;
  readonly token: string;
  readonly databaseUrl: string;
  readonly fixture: CompositorParityFixture;
  readonly pollMs: number;
  readonly timeoutMs: number;
}): Promise<HttpRunResult> {
  const previewBody = {
    intent: args.fixture.intent,
    scope: args.fixture.scope,
    qualityMode: args.fixture.qualityMode,
    language: "pt-BR",
    briefing: args.fixture.briefing
  };

  const preview = await fetchJson(args.baseUrl, args.token, "/api/generation-preview", previewBody);
  if (preview.status !== 200) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: `preview ${preview.status}: ${JSON.stringify(preview.json)}`
    };
  }

  const previewJson = preview.json as {
    compositor?: { planSignature?: string };
    pricingSnapshot?: { quoteId?: string; contentType?: string };
  };
  const quoteId = previewJson.pricingSnapshot?.quoteId;
  if (!quoteId) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: "preview missing quoteId"
    };
  }

  const executeBody = {
    ...previewBody,
    quoteId,
    idempotencyKey: `compositor-parity:${args.fixture.id}:${Date.now()}`
  };

  const execute = await fetchJson(args.baseUrl, args.token, "/me/executions/run", executeBody);
  if (execute.status !== 200 && execute.status !== 202) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: `execute ${execute.status}: ${JSON.stringify(execute.json)}`
    };
  }

  const executeJson = execute.json as { jobId?: string; status?: string };
  const jobId = executeJson.jobId;
  if (!jobId) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      status: "failed",
      error: "execute missing jobId"
    };
  }

  if (executeJson.status !== "queued" && execute.status !== 202) {
    return {
      mode: "compositor",
      fixtureId: args.fixture.id,
      jobId,
      status: "done",
      planSignature: previewJson.compositor?.planSignature ?? previewJson.pricingSnapshot?.contentType,
      legacyContentType: previewJson.pricingSnapshot?.contentType
    };
  }

  const final = await pollJobDone(args.databaseUrl, jobId, args.pollMs, args.timeoutMs);
  const progressHistory = Array.isArray(final.data?.progressHistory) ? final.data.progressHistory : [];

  return {
    mode: "compositor",
    fixtureId: args.fixture.id,
    jobId,
    status: final.status,
    usdCost: readUsdCost(final.data),
    stepCount: progressHistory.length,
    planSignature: readPlanSignature(final.data) ?? previewJson.compositor?.planSignature,
    legacyContentType: previewJson.pricingSnapshot?.contentType,
    error: final.status === "failed" ? "job failed" : undefined
  };
}

function renderReport(input: {
  readonly generatedAt: string;
  readonly dryComparisons: readonly DryPlanComparison[];
  readonly httpRuns: readonly HttpRunResult[];
  readonly httpEnabled: boolean;
}): string {
  const lines: string[] = [
    "# Compositor parity report",
    "",
    `Generated: ${input.generatedAt}`,
    "",
    "## Dry plan comparison (local)",
    "",
    "| Fixture | Legacy contentType | Compositor plan | Steps | Expression | Expectations OK |",
    "|---------|-------------------|-----------------|-------|------------|-----------------|"
  ];

  for (const row of input.dryComparisons) {
    lines.push(
      `| ${row.label} | ${row.legacyContentType} | ${row.compositorPlanSignature} | ${row.compositorStepCount} (${row.compositorStepNames.join(" → ")}) | ${row.expressionProfile} | ${row.planSignatureMatchesExpectation ? "yes" : "**no**"} |`
    );
  }

  lines.push(
    "",
    "## Optional HTTP execution",
    "",
    input.httpEnabled
      ? "HTTP runs executed against the live API (server flag determines legacy vs compositor path)."
      : "Skipped — set `CALIBRATION_ACCESS_TOKEN` and `DATABASE_URL`, then rerun with `--execute`.",
    ""
  );

  if (input.httpRuns.length > 0) {
    lines.push(
      "| Fixture | Job ID | Status | planSignature | USD est. | Progress events |",
      "|---------|--------|--------|---------------|----------|-----------------|"
    );
    for (const run of input.httpRuns) {
      lines.push(
        `| ${run.fixtureId} | ${run.jobId ?? "—"} | ${run.status} | ${run.planSignature ?? "—"} | ${run.usdCost?.toFixed(4) ?? "—"} | ${run.stepCount ?? "—"} |`
      );
    }
    lines.push("");
  }

  lines.push(
    "## Manual rubric (founder — fill after reading outputs)",
    "",
    "Score each fixture 1–5:",
    "",
    "1. **Intent fit** — does the output match the stated goal?",
    "2. **Structure** — appropriate sections/beats for channel?",
    "3. **Voice fidelity** — matches voice profile?",
    "4. **Factual discipline** — no hallucinated claims beyond briefing?",
    "5. **Cost band** — USD within ±30% of legacy median for comparable intent class?",
    "",
    "| Fixture | Intent fit | Structure | Voice | Factual | Cost | Notes |",
    "|---------|------------|-----------|-------|---------|------|-------|"
  );

  for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
    lines.push(`| ${fixture.label} | | | | | | |`);
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const { dryRunOnly, executeHttp, outPath } = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const dryComparisons = COMPOSITOR_PARITY_FIXTURES.map((fixture) => compareFixturePlans(fixture));
  const httpRuns: HttpRunResult[] = [];

  console.log("Compositor parity harness");
  console.log(`Fixtures: ${COMPOSITOR_PARITY_FIXTURES.length}`);
  console.log(`Dry comparisons: ${dryComparisons.filter((row) => row.planSignatureMatchesExpectation).length}/${dryComparisons.length} matched expectations`);

  for (const row of dryComparisons) {
    console.log(
      `[dry] ${row.fixtureId}: legacy=${row.legacyContentType} compositor=${row.compositorPlanSignature} (${row.compositorStepCount} steps)`
    );
  }

  const token = process.env.CALIBRATION_ACCESS_TOKEN?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const httpEnabled = Boolean(token && databaseUrl && executeHttp && !dryRunOnly);

  if (executeHttp && !dryRunOnly) {
    if (!token || !databaseUrl) {
      console.warn("Skipping HTTP runs — CALIBRATION_ACCESS_TOKEN and DATABASE_URL are required.");
    } else {
      loadCalibrationEnvironment();
      const baseUrl = (process.env.CALIBRATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
      const pollMs = Number(process.env.COMPOSITOR_PARITY_POLL_MS ?? "5000");
      const timeoutMs = Number(process.env.COMPOSITOR_PARITY_TIMEOUT_MS ?? "900000");

      console.log(`HTTP execution enabled (base URL: ${baseUrl})`);

      for (const fixture of COMPOSITOR_PARITY_FIXTURES) {
        console.log(`[http] ${fixture.id}`);
        try {
          const result = await runHttpFixture({
            baseUrl,
            token: requireEnv("CALIBRATION_ACCESS_TOKEN"),
            databaseUrl: requireEnv("DATABASE_URL"),
            fixture,
            pollMs,
            timeoutMs
          });
          httpRuns.push(result);
          console.log(
            `  → ${result.status}${result.jobId ? ` (${result.jobId})` : ""}${result.planSignature ? ` plan=${result.planSignature}` : ""}${result.error ? ` — ${result.error}` : ""}`
          );
        } catch (error) {
          httpRuns.push({
            mode: "compositor",
            fixtureId: fixture.id,
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }

  mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    outPath,
    renderReport({
      generatedAt,
      dryComparisons,
      httpRuns,
      httpEnabled
    })
  );

  console.log(`Report written to ${outPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
