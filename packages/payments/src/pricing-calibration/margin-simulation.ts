import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { roundCredits } from "../billing-utils.js";
import type { CalibrationCellStats, CalibrationPricingRow, PlanMarginSimulation } from "./types.js";

export const DEFAULT_TARGET_MARGIN = 0.675;

export function deriveCreditUsdValue(input: {
  readonly canonicalCostUsd: number;
  readonly targetMargin: number;
  readonly targetCanonicalCredits: number;
}): number {
  const canonicalRevenueUsd = input.canonicalCostUsd / (1 - input.targetMargin);
  return canonicalRevenueUsd / input.targetCanonicalCredits;
}

export function deriveCreditPrice(input: {
  readonly costUsd: number;
  readonly targetMargin: number;
  readonly creditUsdValue: number;
}): number {
  const revenueUsd = input.costUsd / (1 - input.targetMargin);
  return roundCredits(revenueUsd / input.creditUsdValue, "ceil_1_decimal");
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index]!;
}

export function buildCellStats(
  rows: readonly { contentType: string; qualityMode: QualityMode; observedUsdCost: number }[],
  contentType: string,
  qualityMode: QualityMode,
  theoreticalCostUsd: number
): CalibrationCellStats {
  const observed = rows
    .filter((row) => row.contentType === contentType && row.qualityMode === qualityMode)
    .map((row) => row.observedUsdCost);

  if (observed.length === 0) {
    return {
      contentType,
      qualityMode,
      sampleCount: 0,
      costUsdP50: theoreticalCostUsd,
      costUsdP90: theoreticalCostUsd * 1.25,
      source: "theoretical"
    };
  }

  return {
    contentType,
    qualityMode,
    sampleCount: observed.length,
    costUsdP50: percentile(observed, 0.5),
    costUsdP90: percentile(observed, 0.9),
    source: "observed"
  };
}

export function simulatePlanMargin(input: {
  readonly planId: string;
  readonly monthlyCredits: number;
  readonly canonicalCreditCost: number;
  readonly revenueUsdMonthly: number;
  readonly validationBalancedCostUsd: number;
}): PlanMarginSimulation {
  const quotaLimit = Math.max(1, Math.floor(input.monthlyCredits / input.canonicalCreditCost));
  const balancedMixCostUsd = quotaLimit * input.validationBalancedCostUsd;
  const worstCaseCostUsd = input.monthlyCredits * (input.validationBalancedCostUsd / input.canonicalCreditCost);
  const grossMarginBalancedMix =
    input.revenueUsdMonthly <= 0
      ? 0
      : (input.revenueUsdMonthly - balancedMixCostUsd) / input.revenueUsdMonthly;

  return {
    planId: input.planId,
    monthlyCredits: input.monthlyCredits,
    quotaLimit,
    revenueUsdMonthly: input.revenueUsdMonthly,
    worstCaseCostUsd,
    balancedMixCostUsd,
    grossMarginBalancedMix
  };
}

export function flattenPricingRows(
  cellStats: readonly CalibrationCellStats[],
  input: {
    readonly targetMargin: number;
    readonly creditUsdValue: number;
    readonly planTiers: readonly string[];
  }
): CalibrationPricingRow[] {
  return input.planTiers.flatMap((planTier) =>
    cellStats.map((cell) => ({
      planTier,
      contentType: cell.contentType,
      qualityMode: cell.qualityMode,
      costUsdP50: cell.costUsdP50,
      creditPrice: deriveCreditPrice({
        costUsd: cell.costUsdP50,
        targetMargin: input.targetMargin,
        creditUsdValue: input.creditUsdValue
      })
    }))
  );
}
