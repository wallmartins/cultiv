import type { QualityMode } from "@my-ai-orchestrator/contracts";

export interface CalibrationTelemetryRow {
  readonly jobId: string;
  readonly contentType: string;
  readonly qualityMode: QualityMode;
  readonly inputTokensTotal: number;
  readonly outputTokensTotal: number;
  readonly observedUsdCost: number;
  readonly debitedCredits: number;
  readonly plannedCreditPrice: number | null;
  readonly policyVersion: string | null;
}

export interface CalibrationCellStats {
  readonly contentType: string;
  readonly qualityMode: QualityMode;
  readonly sampleCount: number;
  readonly costUsdP50: number;
  readonly costUsdP90: number;
  readonly source: "observed" | "theoretical";
}

export interface CalibrationPricingRow {
  readonly planTier: string;
  readonly contentType: string;
  readonly qualityMode: QualityMode;
  readonly creditPrice: number;
  readonly costUsdP50: number;
}

export interface CalibrationReport {
  readonly policyVersion: string;
  readonly creditUsdValue: number;
  readonly canonicalCreditCost: number;
  readonly targetMargin: number;
  readonly telemetryRows: readonly CalibrationTelemetryRow[];
  readonly cellStats: readonly CalibrationCellStats[];
  readonly pricing: readonly CalibrationPricingRow[];
  readonly planSimulation: readonly PlanMarginSimulation[];
}

export interface PlanMarginSimulation {
  readonly planId: string;
  readonly monthlyCredits: number;
  readonly quotaLimit: number;
  readonly revenueUsdMonthly: number;
  readonly worstCaseCostUsd: number;
  readonly balancedMixCostUsd: number;
  readonly grossMarginBalancedMix: number;
}
