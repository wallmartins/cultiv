#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import type { ExecutionPlan, PlanSignature } from "@my-ai-orchestrator/contracts";
import { planGeneration } from "../src/product/generation/compositor/compositor-planner.js";
import { patchExecutionPlan } from "../src/product/generation/step-planner/step-planner.js";
import { formatPatchOp } from "../src/product/generation/step-planner/format-patch-op.js";
import { loadCalibrationEnvironment } from "./calibration/load-env.js";
import {
  runGenerationExecute,
  runGenerationPreview,
  sleep
} from "./calibration/live-generation-api.js";
import { calibrationRepoRoot, resolveCalibrationRepoPath } from "./calibration/resolve-repo-path.js";
import {
  COMPOSITOR_PARITY_FIXTURES,
  findCompositorParityFixture,
  type CompositorParityFixture
} from "./compositor/parity-fixtures.js";
import {
  briefingVariantsForFixture,
  type BriefingVariantKind
} from "./step-planner/briefing-variants.js";

interface DryRunComparison {
  readonly fixtureId: string;
  readonly fixtureLabel: string;
  readonly variant: BriefingVariantKind;
  readonly basePlanSignature: PlanSignature;
  readonly patchedPlanSignature: PlanSignature;
  readonly planSignatureDrifted: boolean;
  readonly baseLlmStepCount: number;
  readonly patchedLlmStepCount: number;
  readonly llmStepDelta: number;
  readonly patchCount: number;
  readonly ops: readonly string[];
}

interface HttpRunComparison {
  readonly fixtureId: string;
  readonly fixtureLabel: string;
  readonly variant: BriefingVariantKind;
  readonly status: "done" | "failed" | "skipped";
  readonly jobId?: string;
  readonly usdCost?: number;
  readonly planSignature?: string;
  readonly plannerPatchCount?: number;
  readonly plannerOps?: readonly string[];
  readonly error?: string;
}

function parseArgs(argv: readonly string[]) {
  const executeHttp = argv.includes("--execute");
  const patchedOnly = argv.includes("--execute-patched-only");
  const fixtureId = argv.includes("--fixture") ? argv[argv.indexOf("--fixture") + 1] : undefined;
  const outPath = argv.includes("--out")
    ? resolveCalibrationRepoPath(
        argv[argv.indexOf("--out") + 1] ?? "docs/superpowers/reports/step-planner-cogs-report.md"
      )
    : resolveCalibrationRepoPath("docs/superpowers/reports/step-planner-cogs-report.md");

  return { executeHttp, patchedOnly, fixtureId, outPath };
}

function selectFixtures(fixtureId?: string): readonly CompositorParityFixture[] {
  if (fixtureId) {
    const fixture = findCompositorParityFixture(fixtureId);
    if (!fixture) {
      throw new Error(`Unknown --fixture id "${fixtureId}"`);
    }
    return [fixture];
  }

  return COMPOSITOR_PARITY_FIXTURES;
}

function fixtureTimeoutMs(fixture: CompositorParityFixture, defaultTimeoutMs: number): number {
  if (fixture.expectedCompositorPlanSignature === "long-piece" && fixture.scope.lengthTier === "long") {
    return Number(process.env.STEP_PLANNER_COGS_LONG_TIMEOUT_MS ?? String(defaultTimeoutMs * 2));
  }

  return defaultTimeoutMs;
}

function countLlmSteps(plan: ExecutionPlan): number {
  return plan.steps.filter((step) => step.execution === "llm").length;
}

function compareFixtureVariant(
  fixture: CompositorParityFixture,
  variant: ReturnType<typeof briefingVariantsForFixture>[number]
): DryRunComparison {
  const basePlan = planGeneration({
    intent: fixture.intent,
    scope: fixture.scope,
    qualityMode: fixture.qualityMode
  });
  const patched = patchExecutionPlan(basePlan, variant.briefing);
  const baseLlmStepCount = countLlmSteps(basePlan);
  const patchedLlmStepCount = countLlmSteps(patched.plan);

  return {
    fixtureId: fixture.id,
    fixtureLabel: fixture.label,
    variant: variant.kind,
    basePlanSignature: basePlan.planSignature,
    patchedPlanSignature: patched.plan.planSignature,
    planSignatureDrifted: basePlan.planSignature !== patched.plan.planSignature,
    baseLlmStepCount,
    patchedLlmStepCount,
    llmStepDelta: patchedLlmStepCount - baseLlmStepCount,
    patchCount: patched.ops.length,
    ops: patched.ops.map(formatPatchOp)
  };
}

function cogsPreviewBody(
  fixture: CompositorParityFixture,
  briefing: Record<string, unknown>
): Record<string, unknown> {
  return {
    intent: fixture.intent,
    scope: fixture.scope,
    qualityMode: fixture.qualityMode,
    language: "pt-BR",
    briefing
  };
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function bucketKey(planSignature: string | undefined): string {
  return planSignature ?? "unknown";
}

function renderReport(input: {
  readonly generatedAt: string;
  readonly comparisons: readonly DryRunComparison[];
  readonly httpRuns: readonly HttpRunComparison[];
  readonly executeEnabled: boolean;
}): string {
  const llmDeltas = input.comparisons.map((row) => Math.abs(row.llmStepDelta));
  const signatureDriftRate =
    input.comparisons.length === 0
      ? 0
      : input.comparisons.filter((row) => row.planSignatureDrifted).length / input.comparisons.length;

  const usdValues = input.httpRuns
    .filter((row) => row.status === "done" && typeof row.usdCost === "number")
    .map((row) => row.usdCost as number);

  const lines: string[] = [
    "# Step planner COGS variance report",
    "",
    `Generated: ${input.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Fixtures × variants: ${input.comparisons.length}`,
    `- p50 absolute LLM step delta: ${percentile(llmDeltas, 50)}`,
    `- p90 absolute LLM step delta: ${percentile(llmDeltas, 90)}`,
    `- planSignature drift rate: ${(signatureDriftRate * 100).toFixed(1)}%`
  ];

  if (input.httpRuns.length > 0) {
    lines.push(
      `- HTTP runs: ${input.httpRuns.filter((row) => row.status === "done").length}/${input.httpRuns.length} done`,
      `- p50 USD (executed): ${percentile(usdValues, 50).toFixed(4)}`,
      `- p90 USD (executed): ${percentile(usdValues, 90).toFixed(4)}`
    );
  }

  lines.push(
    "",
    "## Dry-run comparisons (local)",
    "",
    "| Fixture | Variant | Base plan | Patched plan | Signature drift | Base LLM steps | Patched LLM steps | Δ LLM | Patch ops |",
    "|---------|---------|-----------|--------------|-----------------|----------------|-------------------|-------|-----------|"
  );

  for (const row of input.comparisons) {
    lines.push(
      `| ${row.fixtureLabel} | ${row.variant} | ${row.basePlanSignature} | ${row.patchedPlanSignature} | ${row.planSignatureDrifted ? "yes" : "no"} | ${row.baseLlmStepCount} | ${row.patchedLlmStepCount} | ${row.llmStepDelta >= 0 ? "+" : ""}${row.llmStepDelta} | ${row.patchCount > 0 ? row.ops.join(", ") : "—"} |`
    );
  }

  lines.push(
    "",
    "## HTTP execution",
    "",
    input.executeEnabled
      ? "Live preview + execute against the running API (`COMPOSITOR_V1_ENABLED` + `STEP_PLANNER_V1_ENABLED`)."
      : "Skipped — pass `--execute` with `CALIBRATION_ACCESS_TOKEN` and `DATABASE_URL` in repo `.env`.",
    ""
  );

  if (input.httpRuns.length > 0) {
    lines.push(
      "| Fixture | Variant | Status | Job | planSignature | USD est. | Planner patches |",
      "|---------|---------|--------|-----|---------------|----------|-----------------|"
    );

    for (const row of input.httpRuns) {
      lines.push(
        `| ${row.fixtureLabel} | ${row.variant} | ${row.status} | ${row.jobId ?? "—"} | ${row.planSignature ?? "—"} | ${row.usdCost?.toFixed(4) ?? "—"} | ${row.plannerPatchCount ?? "—"}${row.plannerOps && row.plannerOps.length > 0 ? ` (${row.plannerOps.join(", ")})` : ""} |`
      );
    }

    const bucketUsd = new Map<string, number[]>();
    for (const row of input.httpRuns) {
      if (row.status !== "done" || typeof row.usdCost !== "number") {
        continue;
      }
      const key = bucketKey(row.planSignature);
      const bucket = bucketUsd.get(key) ?? [];
      bucket.push(row.usdCost);
      bucketUsd.set(key, bucket);
    }

    if (bucketUsd.size > 0) {
      lines.push("", "### USD by final planSignature", "", "| planSignature | Runs | p50 USD | p90 USD |", "|---------------|------|---------|---------|");
      for (const [signature, values] of [...bucketUsd.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        lines.push(
          `| ${signature} | ${values.length} | ${percentile(values, 50).toFixed(4)} | ${percentile(values, 90).toFixed(4)} |`
        );
      }
    }

    const failures = input.httpRuns.filter((row) => row.status === "failed");
    if (failures.length > 0) {
      lines.push("", "### HTTP failures", "");
      for (const row of failures) {
        lines.push(`- **${row.fixtureId}/${row.variant}**: ${row.error ?? "failed"}`);
      }
    }
  }

  lines.push(
    "",
    "## Repricing gate (one-pager)",
    "",
    "Proceed with full repricing when either:",
    "",
    "- ≥80% of runs keep the same `planSignature` after patches, **or**",
    "- p90 USD within ±30% of bucket median for each `(planSignature, tier, balanced)`.",
    ""
  );

  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const { executeHttp, patchedOnly, fixtureId, outPath } = parseArgs(process.argv.slice(2));
  const fixtures = selectFixtures(fixtureId);
  const generatedAt = new Date().toISOString();
  const variantRows = fixtures.flatMap((fixture) =>
    briefingVariantsForFixture(fixture).map((variant) => ({
      fixture,
      variant,
      dry: compareFixtureVariant(fixture, variant)
    }))
  );
  const comparisons = variantRows.map((row) => row.dry);
  const httpRuns: HttpRunComparison[] = [];

  console.log("Step planner COGS harness");
  console.log(`Repo root: ${calibrationRepoRoot()}`);
  console.log(`Fixtures: ${fixtures.length} (${comparisons.length} variant rows)`);

  for (const row of comparisons) {
    console.log(
      `[dry] ${row.fixtureId}/${row.variant}: ${row.basePlanSignature} → ${row.patchedPlanSignature} (Δ LLM ${row.llmStepDelta}, patches ${row.patchCount})`
    );
  }

  if (executeHttp) {
    loadCalibrationEnvironment();
    const token = process.env.CALIBRATION_ACCESS_TOKEN?.trim();
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!token || !databaseUrl) {
      const missing = [
        !token ? "CALIBRATION_ACCESS_TOKEN" : null,
        !databaseUrl ? "DATABASE_URL" : null
      ].filter((name): name is string => name !== null);
      throw new Error(
        `HTTP mode requires ${missing.join(" and ")} in ${calibrationRepoRoot()}/.env`
      );
    }

    const baseUrl = (process.env.CALIBRATION_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
    const pollMs = Number(process.env.STEP_PLANNER_COGS_POLL_MS ?? process.env.COMPOSITOR_PARITY_POLL_MS ?? "5000");
    const timeoutMs = Number(
      process.env.STEP_PLANNER_COGS_TIMEOUT_MS ?? process.env.COMPOSITOR_PARITY_TIMEOUT_MS ?? "900000"
    );
    const delayMs = Number(
      process.env.STEP_PLANNER_COGS_DELAY_MS ?? process.env.COMPOSITOR_PARITY_DELAY_MS ?? "3000"
    );

    const rowsToExecute = patchedOnly
      ? variantRows.filter((row) => row.dry.patchCount > 0)
      : variantRows;

    console.log(
      `HTTP execution enabled (base URL: ${baseUrl}, rows ${rowsToExecute.length}/${variantRows.length}${patchedOnly ? ", patched-only" : ""})`
    );

    for (const row of rowsToExecute) {
      const key = `${row.fixture.id}/${row.variant.kind}`;
      console.log(`[http] ${key}`);

      const previewBody = cogsPreviewBody(row.fixture, row.variant.briefing);
      const preview = await runGenerationPreview({ baseUrl, token, body: previewBody });

      if (preview.error || !preview.quoteId) {
        httpRuns.push({
          fixtureId: row.fixture.id,
          fixtureLabel: row.fixture.label,
          variant: row.variant.kind,
          status: "failed",
          error: preview.error ?? "preview missing quoteId"
        });
        console.log(`  → failed — ${preview.error ?? "preview missing quoteId"}`);
        continue;
      }

      const execution = await runGenerationExecute({
        baseUrl,
        token,
        databaseUrl,
        previewBody,
        quoteId: preview.quoteId,
        idempotencyKey: `step-planner-cogs:${row.fixture.id}:${row.variant.kind}:${Date.now()}`,
        pollMs,
        timeoutMs: fixtureTimeoutMs(row.fixture, timeoutMs)
      });

      httpRuns.push({
        fixtureId: row.fixture.id,
        fixtureLabel: row.fixture.label,
        variant: row.variant.kind,
        status: execution.status,
        jobId: execution.jobId,
        usdCost: execution.usdCost,
        planSignature: execution.planSignature ?? preview.planSignature,
        plannerPatchCount: execution.planner?.patchCount,
        plannerOps: execution.planner?.ops,
        error: execution.error
      });

      console.log(
        `  → ${execution.status}${execution.jobId ? ` (${execution.jobId})` : ""}${execution.usdCost !== undefined ? ` usd=${execution.usdCost.toFixed(4)}` : ""}${execution.error ? ` — ${execution.error}` : ""}`
      );

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    for (const row of variantRows.filter((entry) => entry.dry.patchCount === 0 && patchedOnly)) {
      httpRuns.push({
        fixtureId: row.fixture.id,
        fixtureLabel: row.fixture.label,
        variant: row.variant.kind,
        status: "skipped",
        error: "skipped by --execute-patched-only"
      });
    }
  }

  mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    outPath,
    renderReport({
      generatedAt,
      comparisons,
      httpRuns,
      executeEnabled: executeHttp
    })
  );

  console.log(`Report written to ${outPath}`);

  const httpFailed = httpRuns.some((row) => row.status === "failed");
  if (httpFailed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
