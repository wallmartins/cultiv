#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseJobTelemetryRows } from "../../../packages/payments/src/pricing-calibration/index.js";
import { resolvePhase1LegacyContentTypeId } from "@my-ai-orchestrator/contracts";
import type { GenerationIntent, GenerationLengthTier } from "@my-ai-orchestrator/contracts";

const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

interface TierCostStats {
  readonly lengthTier: GenerationLengthTier;
  readonly legacyContentType: string;
  readonly sampleCount: number;
  readonly meanUsd: number;
  readonly minUsd: number;
  readonly maxUsd: number;
}

interface IntentVarianceReport {
  readonly intent: GenerationIntent;
  readonly tierStats: readonly TierCostStats[];
  readonly spreadRatio: number;
  readonly distinctPipelines: number;
  readonly tierChangesPipeline: boolean;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeIntentVariance(
  intent: GenerationIntent,
  rows: ReturnType<typeof parseJobTelemetryRows>
): IntentVarianceReport | null {
  const tiers: GenerationLengthTier[] = ["short", "medium", "long"];
  const tierStats: TierCostStats[] = [];

  for (const lengthTier of tiers) {
    const legacyContentType = resolvePhase1LegacyContentTypeId(intent, lengthTier);
    const costs = rows
      .filter((row) => row.contentType === legacyContentType)
      .map((row) => row.observedUsdCost);

    if (costs.length === 0) {
      continue;
    }

    tierStats.push({
      lengthTier,
      legacyContentType,
      sampleCount: costs.length,
      meanUsd: mean(costs),
      minUsd: Math.min(...costs),
      maxUsd: Math.max(...costs)
    });
  }

  if (tierStats.length === 0) {
    return null;
  }

  const means = tierStats.map((stat) => stat.meanUsd);
  const minMean = Math.min(...means);
  const maxMean = Math.max(...means);
  const spreadRatio = minMean > 0 ? maxMean / minMean : maxMean > 0 ? Infinity : 1;
  const distinctPipelines = new Set(tierStats.map((stat) => stat.legacyContentType)).size;

  return {
    intent,
    tierStats,
    spreadRatio,
    distinctPipelines,
    tierChangesPipeline: distinctPipelines > 1
  };
}

function formatReport(reports: readonly IntentVarianceReport[], totalRows: number): string {
  const lines: string[] = [
    "# Option B viability — calibration analysis",
    "",
    `Observed telemetry rows: ${totalRows}`,
    "",
    "This report uses Phase 1 behavior: `intent × lengthTier` resolves to legacy pipelines.",
    "High spread within an intent suggests tier-driven execution economics — supports hybrid/Option B pricing.",
    "",
    "## Per-intent tier cost spread",
    "",
    "| Intent | Tiers sampled | Distinct pipelines | Spread (max/min mean USD) | Signal |",
    "|--------|---------------|--------------------|---------------------------|--------|"
  ];

  for (const report of reports) {
    const signal =
      report.tierChangesPipeline && report.spreadRatio >= 1.35
        ? "strong"
        : report.tierChangesPipeline
          ? "moderate"
          : "weak (tier = wordTarget only today)";
    lines.push(
      `| ${report.intent} | ${report.tierStats.length} | ${report.distinctPipelines} | ${report.spreadRatio.toFixed(2)}× | ${signal} |`
    );
  }

  lines.push("", "## Tier detail", "");

  for (const report of reports) {
    lines.push(`### ${report.intent}`, "");
    lines.push("| Tier | Legacy pipeline | n | mean USD | min | max |");
    lines.push("|------|-----------------|---|----------|-----|-----|");
    for (const stat of report.tierStats) {
      lines.push(
        `| ${stat.lengthTier} | ${stat.legacyContentType} | ${stat.sampleCount} | $${stat.meanUsd.toFixed(4)} | $${stat.minUsd.toFixed(4)} | $${stat.maxUsd.toFixed(4)} |`
      );
    }
    lines.push("");
  }

  const strongCount = reports.filter((r) => r.tierChangesPipeline && r.spreadRatio >= 1.35).length;
  lines.push("## Recommendation", "");
  if (strongCount >= 3) {
    lines.push(
      "- **Option B / hybrid tier modifiers:** Economically justified — tier changes pipeline and/or cost spread is material.",
      "- Phase 2: prefer **4 named profiles + tier in pricing matrix**; defer full parametric composer to Phase 3 unless quality tests demand it."
    );
  } else if (reports.some((r) => r.tierChangesPipeline)) {
    lines.push(
      "- **Hybrid (4 profiles + tier pricing):** Justified, but collect more samples per tier (n≥5) before locking prices.",
      "- **Full Option B (1 parametric pipeline):** Not yet proven on cost data alone — run `tier-variance` profile with `--repeats 5`."
    );
  } else {
    lines.push(
      "- Insufficient tier-driven cost signal — stay on **Option A** (profiles only) for Phase 2 execution; tier affects wordTarget + pricing policy only."
    );
  }

  lines.push("");
  return lines.join("\n");
}

function main(): void {
  const inputPath = resolve(process.argv[2] ?? `${repoRoot}/docs/superpowers/reports/calibration-jobs-sweep.json`);
  const reportPath = resolve(
    process.argv[3] ?? `${repoRoot}/docs/superpowers/reports/calibration-option-b-viability.md`
  );

  const jobs = JSON.parse(readFileSync(inputPath, "utf8")) as unknown;
  const rows = parseJobTelemetryRows(jobs);

  const intents: GenerationIntent[] = [
    "share-idea",
    "explain-deeply",
    "engage-audience",
    "tell-story",
    "update-subscribers",
    "document-decision"
  ];

  const reports = intents
    .map((intent) => analyzeIntentVariance(intent, rows))
    .filter((report): report is IntentVarianceReport => report !== null);

  const markdown = formatReport(reports, rows.length);
  writeFileSync(reportPath, `${markdown}\n`);
  console.log(markdown);
  console.log(`\nReport written to ${reportPath}`);
}

main();
