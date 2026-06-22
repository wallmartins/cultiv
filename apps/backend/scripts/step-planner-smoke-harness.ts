#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
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
  findStepPlannerSmokeScenario,
  smokePreviewBody,
  STEP_PLANNER_SMOKE_SCENARIOS,
  type StepPlannerSmokeScenario
} from "./step-planner/smoke-scenarios.js";

interface DryRunResult {
  readonly scenarioId: string;
  readonly label: string;
  readonly passed: boolean;
  readonly patchCount: number;
  readonly ops: readonly string[];
  readonly finalPlanSignature: string;
  readonly failures: readonly string[];
}

interface HttpRunResult {
  readonly scenarioId: string;
  readonly label: string;
  readonly passed: boolean;
  readonly previewPlanSignature?: string;
  readonly quotaCost?: number;
  readonly quotaRemaining?: number;
  readonly jobId?: string;
  readonly status?: string;
  readonly usdCost?: number;
  readonly plannerPatchCount?: number;
  readonly plannerOps?: readonly string[];
  readonly failures: readonly string[];
}

function parseArgs(argv: readonly string[]) {
  const executeHttp = argv.includes("--execute");
  const fixtureId = argv.includes("--fixture") ? argv[argv.indexOf("--fixture") + 1] : undefined;
  const outPath = argv.includes("--out")
    ? resolveCalibrationRepoPath(
        argv[argv.indexOf("--out") + 1] ?? "docs/superpowers/reports/step-planner-smoke-report.md"
      )
    : resolveCalibrationRepoPath("docs/superpowers/reports/step-planner-smoke-report.md");

  return { executeHttp, fixtureId, outPath };
}

function selectScenarios(fixtureId?: string): readonly StepPlannerSmokeScenario[] {
  if (fixtureId) {
    const scenario = findStepPlannerSmokeScenario(fixtureId);
    if (!scenario) {
      throw new Error(`Unknown --fixture id "${fixtureId}"`);
    }
    return [scenario];
  }

  return STEP_PLANNER_SMOKE_SCENARIOS;
}

function sortedOps(ops: readonly string[]): string[] {
  return [...ops].sort();
}

function runDryScenario(scenario: StepPlannerSmokeScenario): DryRunResult {
  const basePlan = planGeneration({
    intent: scenario.fixture.intent,
    scope: scenario.fixture.scope,
    qualityMode: scenario.fixture.qualityMode
  });
  const patched = patchExecutionPlan(basePlan, scenario.briefing);
  const ops = patched.ops.map(formatPatchOp);
  const failures: string[] = [];

  if (patched.ops.length !== scenario.expectPatchCount) {
    failures.push(`patchCount expected ${scenario.expectPatchCount}, got ${patched.ops.length}`);
  }

  if (sortedOps(ops).join("|") !== sortedOps(scenario.expectOps).join("|")) {
    failures.push(`ops expected [${scenario.expectOps.join(", ")}], got [${ops.join(", ")}]`);
  }

  if (patched.plan.planSignature !== scenario.expectFinalPlanSignature) {
    failures.push(
      `planSignature expected ${scenario.expectFinalPlanSignature}, got ${patched.plan.planSignature}`
    );
  }

  return {
    scenarioId: scenario.id,
    label: scenario.label,
    passed: failures.length === 0,
    patchCount: patched.ops.length,
    ops,
    finalPlanSignature: patched.plan.planSignature,
    failures
  };
}

function assertQuotaPreview(preview: Awaited<ReturnType<typeof runGenerationPreview>>): string[] {
  const failures: string[] = [];

  if (typeof preview.quotaCost !== "number" || preview.quotaCost < 1) {
    failures.push(`quotaCost expected >= 1, got ${String(preview.quotaCost)}`);
  }

  if (typeof preview.quotaRemaining !== "number" || preview.quotaRemaining < 0) {
    failures.push(`quotaRemaining expected >= 0, got ${String(preview.quotaRemaining)}`);
  }

  if (typeof preview.quotaLimit !== "number" || preview.quotaLimit < 1) {
    failures.push(`quotaLimit expected >= 1, got ${String(preview.quotaLimit)}`);
  }

  if (typeof preview.canonicalCreditCost !== "number" || preview.canonicalCreditCost <= 0) {
    failures.push(`canonicalCreditCost expected > 0, got ${String(preview.canonicalCreditCost)}`);
  }

  return failures;
}

async function runHttpScenario(args: {
  readonly scenario: StepPlannerSmokeScenario;
  readonly baseUrl: string;
  readonly token: string;
  readonly databaseUrl: string;
  readonly pollMs: number;
  readonly defaultTimeoutMs: number;
  readonly delayMs: number;
}): Promise<HttpRunResult> {
  const failures: string[] = [];
  const previewBody = smokePreviewBody(args.scenario);
  const preview = await runGenerationPreview({
    baseUrl: args.baseUrl,
    token: args.token,
    body: previewBody
  });

  if (preview.error) {
    return {
      scenarioId: args.scenario.id,
      label: args.scenario.label,
      passed: false,
      failures: [preview.error]
    };
  }

  failures.push(...assertQuotaPreview(preview));

  if (preview.planSignature !== args.scenario.expectFinalPlanSignature) {
    failures.push(
      `preview planSignature expected ${args.scenario.expectFinalPlanSignature}, got ${preview.planSignature ?? "?"}`
    );
  }

  const execution = await runGenerationExecute({
    baseUrl: args.baseUrl,
    token: args.token,
    databaseUrl: args.databaseUrl,
    previewBody,
    quoteId: preview.quoteId!,
    idempotencyKey: `step-planner-smoke:${args.scenario.id}:${Date.now()}`,
    pollMs: args.pollMs,
    timeoutMs: args.scenario.httpTimeoutMs ?? args.defaultTimeoutMs
  });

  if (execution.error) {
    failures.push(execution.error);
  }

  if (execution.status !== "done") {
    failures.push(`execution status expected done, got ${execution.status}`);
  }

  if (!execution.planner) {
    failures.push("execution telemetry missing planner block (is STEP_PLANNER_V1_ENABLED on?)");
  } else {
    if (execution.planner.patchCount !== args.scenario.expectPatchCount) {
      failures.push(
        `planner.patchCount expected ${args.scenario.expectPatchCount}, got ${execution.planner.patchCount}`
      );
    }

    if (
      sortedOps(execution.planner.ops).join("|") !== sortedOps(args.scenario.expectOps).join("|")
    ) {
      failures.push(
        `planner.ops expected [${args.scenario.expectOps.join(", ")}], got [${execution.planner.ops.join(", ")}]`
      );
    }

    if (execution.planner.finalPlanSignature !== args.scenario.expectFinalPlanSignature) {
      failures.push(
        `planner.finalPlanSignature expected ${args.scenario.expectFinalPlanSignature}, got ${execution.planner.finalPlanSignature}`
      );
    }
  }

  if (args.delayMs > 0) {
    await sleep(args.delayMs);
  }

  return {
    scenarioId: args.scenario.id,
    label: args.scenario.label,
    passed: failures.length === 0,
    previewPlanSignature: preview.planSignature,
    quotaCost: preview.quotaCost,
    quotaRemaining: preview.quotaRemaining,
    jobId: execution.jobId,
    status: execution.status,
    usdCost: execution.usdCost,
    plannerPatchCount: execution.planner?.patchCount,
    plannerOps: execution.planner?.ops,
    failures
  };
}

function renderReport(input: {
  readonly generatedAt: string;
  readonly dryRuns: readonly DryRunResult[];
  readonly httpRuns: readonly HttpRunResult[];
  readonly httpEnabled: boolean;
}): string {
  const dryPassed = input.dryRuns.filter((row) => row.passed).length;
  const httpPassed = input.httpRuns.filter((row) => row.passed).length;

  const lines: string[] = [
    "# Step planner smoke report",
    "",
    `Generated: ${input.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Dry scenarios: ${dryPassed}/${input.dryRuns.length} passed`,
    input.httpEnabled
      ? `- HTTP scenarios: ${httpPassed}/${input.httpRuns.length} passed`
      : "- HTTP scenarios: skipped (pass `--execute`)",
    "",
    "## Prerequisites (HTTP mode)",
    "",
    "- `COMPOSITOR_V1_ENABLED=true` and `STEP_PLANNER_V1_ENABLED=true` on API + worker",
    "- `.env` at repo root with `CALIBRATION_ACCESS_TOKEN`, `DATABASE_URL`",
    "- Optional: `CALIBRATION_BASE_URL` (default `http://127.0.0.1:3001`)",
    "",
    "## Dry-run planner assertions",
    "",
    "| Scenario | Pass | Patches | Ops | Final plan |",
    "|----------|------|---------|-----|------------|"
  ];

  for (const row of input.dryRuns) {
    lines.push(
      `| ${row.scenarioId} | ${row.passed ? "yes" : "**no**"} | ${row.patchCount} | ${row.ops.length > 0 ? row.ops.join(", ") : "—"} | ${row.finalPlanSignature} |`
    );
  }

  if (input.dryRuns.some((row) => !row.passed)) {
    lines.push("", "### Dry-run failures", "");
    for (const row of input.dryRuns.filter((entry) => !entry.passed)) {
      lines.push(`- **${row.scenarioId}**: ${row.failures.join("; ")}`);
    }
  }

  lines.push(
    "",
    "## HTTP execution",
    "",
    input.httpEnabled
      ? "Live preview + execute against the running API."
      : "Skipped — rerun with `--execute` after wiring calibration env.",
    ""
  );

  if (input.httpRuns.length > 0) {
    lines.push(
      "| Scenario | Pass | Preview plan | Quota cost | Job | Status | USD est. | Planner patches |",
      "|----------|------|--------------|------------|-----|--------|----------|-----------------|"
    );

    for (const row of input.httpRuns) {
      lines.push(
        `| ${row.scenarioId} | ${row.passed ? "yes" : "**no**"} | ${row.previewPlanSignature ?? "—"} | ${row.quotaCost ?? "—"} | ${row.jobId ?? "—"} | ${row.status ?? "—"} | ${row.usdCost?.toFixed(4) ?? "—"} | ${row.plannerPatchCount ?? "—"}${row.plannerOps && row.plannerOps.length > 0 ? ` (${row.plannerOps.join(", ")})` : ""} |`
      );
    }

    if (input.httpRuns.some((row) => !row.passed)) {
      lines.push("", "### HTTP failures", "");
      for (const row of input.httpRuns.filter((entry) => !entry.passed)) {
        lines.push(`- **${row.scenarioId}**: ${row.failures.join("; ")}`);
      }
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const { executeHttp, fixtureId, outPath } = parseArgs(process.argv.slice(2));
  const scenarios = selectScenarios(fixtureId);
  const generatedAt = new Date().toISOString();
  const dryRuns = scenarios.map((scenario) => runDryScenario(scenario));
  const httpRuns: HttpRunResult[] = [];

  console.log("Step planner smoke harness");
  console.log(`Repo root: ${calibrationRepoRoot()}`);
  console.log(`Scenarios: ${scenarios.length}`);

  for (const row of dryRuns) {
    console.log(
      `[dry] ${row.scenarioId}: ${row.passed ? "PASS" : "FAIL"} (patches ${row.patchCount}, plan ${row.finalPlanSignature})`
    );
    if (!row.passed) {
      for (const failure of row.failures) {
        console.log(`  ✗ ${failure}`);
      }
    }
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
    const pollMs = Number(process.env.STEP_PLANNER_SMOKE_POLL_MS ?? process.env.COMPOSITOR_PARITY_POLL_MS ?? "5000");
    const timeoutMs = Number(
      process.env.STEP_PLANNER_SMOKE_TIMEOUT_MS ?? process.env.COMPOSITOR_PARITY_TIMEOUT_MS ?? "900000"
    );
    const delayMs = Number(
      process.env.STEP_PLANNER_SMOKE_DELAY_MS ?? process.env.COMPOSITOR_PARITY_DELAY_MS ?? "3000"
    );

    console.log(`HTTP execution enabled (base URL: ${baseUrl})`);

    for (const scenario of scenarios) {
      console.log(`[http] ${scenario.id}`);
      const result = await runHttpScenario({
        scenario,
        baseUrl,
        token,
        databaseUrl,
        pollMs,
        defaultTimeoutMs: timeoutMs,
        delayMs
      });
      httpRuns.push(result);
      console.log(
        `  → ${result.passed ? "PASS" : "FAIL"}${result.jobId ? ` (${result.jobId})` : ""}${result.usdCost !== undefined ? ` usd=${result.usdCost.toFixed(4)}` : ""}`
      );
      if (!result.passed) {
        for (const failure of result.failures) {
          console.log(`  ✗ ${failure}`);
        }
      }
    }
  }

  mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    outPath,
    renderReport({
      generatedAt,
      dryRuns,
      httpRuns,
      httpEnabled: executeHttp
    })
  );

  console.log(`Report written to ${outPath}`);

  const dryFailed = dryRuns.some((row) => !row.passed);
  const httpFailed = httpRuns.some((row) => !row.passed);
  if (dryFailed || httpFailed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
