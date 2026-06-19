#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import type { ExecutionPlan, PlanSignature } from "@my-ai-orchestrator/contracts";
import { planGeneration } from "../src/product/generation/compositor/compositor-planner.js";
import { patchExecutionPlan } from "../src/product/generation/step-planner/step-planner.js";
import { formatPatchOp } from "../src/product/generation/step-planner/format-patch-op.js";
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

function parseArgs(argv: readonly string[]) {
  const dryRunOnly = !argv.includes("--execute");
  const fixtureId = argv.includes("--fixture") ? argv[argv.indexOf("--fixture") + 1] : undefined;
  const outPath = argv.includes("--out")
    ? resolveCalibrationRepoPath(argv[argv.indexOf("--out") + 1] ?? "docs/superpowers/reports/step-planner-cogs-report.md")
    : resolveCalibrationRepoPath("docs/superpowers/reports/step-planner-cogs-report.md");

  return { dryRunOnly, fixtureId, outPath };
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

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
}

function renderReport(input: {
  readonly generatedAt: string;
  readonly comparisons: readonly DryRunComparison[];
  readonly executeEnabled: boolean;
}): string {
  const llmDeltas = input.comparisons.map((row) => Math.abs(row.llmStepDelta));
  const signatureDriftRate =
    input.comparisons.length === 0
      ? 0
      : input.comparisons.filter((row) => row.planSignatureDrifted).length / input.comparisons.length;

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
    `- planSignature drift rate: ${(signatureDriftRate * 100).toFixed(1)}%`,
    "",
    "## Dry-run comparisons (local)",
    "",
    "| Fixture | Variant | Base plan | Patched plan | Signature drift | Base LLM steps | Patched LLM steps | Δ LLM | Patch ops |",
    "|---------|---------|-----------|--------------|-----------------|----------------|-------------------|-------|-----------|"
  ];

  for (const row of input.comparisons) {
    lines.push(
      `| ${row.fixtureLabel} | ${row.variant} | ${row.basePlanSignature} | ${row.patchedPlanSignature} | ${row.planSignatureDrifted ? "yes" : "no"} | ${row.baseLlmStepCount} | ${row.patchedLlmStepCount} | ${row.llmStepDelta >= 0 ? "+" : ""}${row.llmStepDelta} | ${row.patchCount > 0 ? row.ops.join(", ") : "—"} |`
    );
  }

  lines.push(
    "",
    "## Optional HTTP execution",
    "",
    input.executeEnabled
      ? "Live execution mode is not implemented in this harness yet — dry-run captures planner variance before repricing."
      : "Skipped — dry-run only. Pass `--execute` when live calibration env is wired (future).",
    ""
  );

  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const { dryRunOnly, fixtureId, outPath } = parseArgs(process.argv.slice(2));
  const fixtures = selectFixtures(fixtureId);
  const generatedAt = new Date().toISOString();
  const comparisons = fixtures.flatMap((fixture) =>
    briefingVariantsForFixture(fixture).map((variant) => compareFixtureVariant(fixture, variant))
  );

  console.log("Step planner COGS harness");
  console.log(`Repo root: ${calibrationRepoRoot()}`);
  console.log(`Fixtures: ${fixtures.length} (${comparisons.length} variant rows)`);

  for (const row of comparisons) {
    console.log(
      `[dry] ${row.fixtureId}/${row.variant}: ${row.basePlanSignature} → ${row.patchedPlanSignature} (Δ LLM ${row.llmStepDelta}, patches ${row.patchCount})`
    );
  }

  mkdirSync(outPath.slice(0, outPath.lastIndexOf("/")), { recursive: true });
  writeFileSync(
    outPath,
    renderReport({
      generatedAt,
      comparisons,
      executeEnabled: !dryRunOnly
    })
  );

  console.log(`Report written to ${outPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
