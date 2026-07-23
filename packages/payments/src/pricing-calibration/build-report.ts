import type { CalibrationReport } from "./types.js";
import {
  buildCellStats,
  DEFAULT_TARGET_MARGIN,
  deriveCreditPrice,
  deriveCreditUsdValue,
  flattenPricingRows,
  simulatePlanMargin
} from "./margin-simulation.js";
import { parseJobTelemetryRows } from "./telemetry-ingest.js";
import {
  CALIBRATION_CONTENT_TYPES,
  CALIBRATION_PLAN_TIERS,
  CALIBRATION_QUALITY_MODES,
  estimateTheoreticalCostUsd
} from "./theoretical-cost.js";

export type CalibrationPlanGrants = Readonly<
  Record<string, { readonly monthlyCredits: number; readonly revenueUsdMonthly: number }>
>;

export interface BuildCalibrationReportOptions {
  readonly jobs: unknown;
  readonly policyVersion?: string;
  readonly targetMargin?: number;
  readonly targetCanonicalCredits?: number;
  readonly planGrants?: CalibrationPlanGrants;
}

// Espelha catalog-pricing.json (monthlyCredits = ceil(monthlyGenerations × 2.5); receita =
// priceCents.USD). O plano free saiu na ADR 0006 — entram trial e a escada real.
const DEFAULT_PLAN_GRANTS: CalibrationPlanGrants = {
  trial: { monthlyCredits: 20, revenueUsdMonthly: 0 },
  explorador: { monthlyCredits: 100, revenueUsdMonthly: 9 },
  criador: { monthlyCredits: 300, revenueUsdMonthly: 19 },
  profissional: { monthlyCredits: 1000, revenueUsdMonthly: 49 }
};

export function buildCalibrationReport(options: BuildCalibrationReportOptions): CalibrationReport {
  const targetMargin = options.targetMargin ?? DEFAULT_TARGET_MARGIN;
  const targetCanonicalCredits = options.targetCanonicalCredits ?? 12;
  const telemetryRows = parseJobTelemetryRows(options.jobs);

  const cellStats = CALIBRATION_CONTENT_TYPES.flatMap((contentType) =>
    CALIBRATION_QUALITY_MODES.map((qualityMode) =>
      buildCellStats(
        telemetryRows,
        contentType,
        qualityMode,
        estimateTheoreticalCostUsd({ contentType, qualityMode })
      )
    )
  );

  const canonicalCell =
    cellStats.find((cell) => cell.contentType === "serial-piece" && cell.qualityMode === "balanced")!;
  const creditUsdValue = deriveCreditUsdValue({
    canonicalCostUsd: canonicalCell.costUsdP50,
    targetMargin,
    targetCanonicalCredits
  });
  const canonicalCreditCost = deriveCreditPrice({
    costUsd: canonicalCell.costUsdP50,
    targetMargin,
    creditUsdValue
  });

  const pricing = flattenPricingRows(cellStats, {
    targetMargin,
    creditUsdValue,
    planTiers: CALIBRATION_PLAN_TIERS
  });

  const planGrants = options.planGrants ?? DEFAULT_PLAN_GRANTS;
  const planSimulation = Object.entries(planGrants).map(([planId, grant]) =>
    simulatePlanMargin({
      planId,
      monthlyCredits: grant.monthlyCredits,
      canonicalCreditCost,
      revenueUsdMonthly: grant.revenueUsdMonthly,
      validationBalancedCostUsd: canonicalCell.costUsdP50
    })
  );

  return {
    policyVersion: options.policyVersion ?? "2026-06-18",
    creditUsdValue,
    canonicalCreditCost,
    targetMargin,
    telemetryRows,
    cellStats,
    pricing,
    planSimulation
  };
}

export function formatCalibrationReport(report: CalibrationReport): string {
  const lines: string[] = [
    `# Hybrid pricing calibration report`,
    ``,
    `Policy version: ${report.policyVersion}`,
    `Observed jobs: ${report.telemetryRows.length}`,
    `Target margin: ${(report.targetMargin * 100).toFixed(1)}%`,
    `Credit USD value (revenue/credit): $${report.creditUsdValue.toFixed(6)}`,
    `Canonical credit cost (serial-piece × balanced): ${report.canonicalCreditCost}`,
    ``,
    `## Observed generations`,
    ``
  ];

  if (report.telemetryRows.length === 0) {
    lines.push(`_No completed jobs with telemetry._`, ``);
  } else {
    lines.push(
      `| Job | Format | Mode | In tokens | Out tokens | USD cost | Debited credits | Planned price |`,
      `|-----|--------|------|-----------|------------|----------|-----------------|---------------|`
    );
    for (const row of report.telemetryRows) {
      lines.push(
        `| ${row.jobId.slice(0, 8)}… | ${row.contentType} | ${row.qualityMode} | ${row.inputTokensTotal} | ${row.outputTokensTotal} | $${row.observedUsdCost.toFixed(4)} | ${row.debitedCredits} | ${row.plannedCreditPrice ?? "—"} |`
      );
    }
    lines.push(``);
  }

  lines.push(`## Cost cells (p50 used for pricing)`, ``);
  lines.push(`| Format | Mode | Samples | p50 USD | p90 USD | Source | Credit price |`);
  lines.push(`|--------|------|---------|---------|---------|--------|--------------|`);
  for (const cell of report.cellStats) {
    const price = report.pricing.find(
      (p) => p.contentType === cell.contentType && p.qualityMode === cell.qualityMode && p.planTier === "pro"
    )!;
    lines.push(
      `| ${cell.contentType} | ${cell.qualityMode} | ${cell.sampleCount} | $${cell.costUsdP50.toFixed(4)} | $${cell.costUsdP90.toFixed(4)} | ${cell.source} | ${price.creditPrice} |`
    );
  }
  lines.push(``);

  lines.push(`## Quota equivalences (monthly grant ÷ canonical)`, ``);
  lines.push(`| Plan | Credits/mo | ~Quotas | Revenue USD/mo | COGS (all balanced) | Gross margin |`);
  lines.push(`|------|------------|---------|----------------|---------------------|--------------|`);
  for (const plan of report.planSimulation) {
    lines.push(
      `| ${plan.planId} | ${plan.monthlyCredits} | ${plan.quotaLimit} | $${plan.revenueUsdMonthly.toFixed(2)} | $${plan.balancedMixCostUsd.toFixed(2)} | ${(plan.grossMarginBalancedMix * 100).toFixed(1)}% |`
    );
  }
  lines.push(``);

  const proBalanced = report.pricing.find(
    (p) => p.planTier === "pro" && p.contentType === "serial-piece" && p.qualityMode === "balanced"
  )!;
  const proStrictLongPiece = report.pricing.find(
    (p) => p.planTier === "pro" && p.contentType === "long-piece" && p.qualityMode === "strict"
  )!;
  lines.push(`## Reference conversions`, ``);
  lines.push(`- 1 quota ≈ ${report.canonicalCreditCost} internal credits`);
  lines.push(
    `- Pro balanced serial-piece: ${proBalanced.creditPrice} credits ≈ ${Math.ceil(proBalanced.creditPrice / report.canonicalCreditCost)} quota(s)`
  );
  lines.push(
    `- Pro strict long-piece: ${proStrictLongPiece.creditPrice} credits ≈ ${Math.ceil(proStrictLongPiece.creditPrice / report.canonicalCreditCost)} quota(s)`
  );

  return lines.join("\n");
}

export function toPricingDocument(report: CalibrationReport) {
  return {
    policyVersion: report.policyVersion,
    lifecycle: "active" as const,
    creditUsdValue: report.creditUsdValue,
    canonicalCreditCost: report.canonicalCreditCost,
    targetMargin: report.targetMargin,
    pricing: report.pricing.map((row) => ({
      planTier: row.planTier,
      contentType: row.contentType,
      qualityMode: row.qualityMode,
      creditPrice: row.creditPrice
    }))
  };
}
