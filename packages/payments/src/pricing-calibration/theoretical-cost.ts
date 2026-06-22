import type { QualityMode } from "@my-ai-orchestrator/contracts";

const THEORETICAL_COST_USD: Record<string, Record<QualityMode, number>> = {
  "twitter-thread": { fast: 0.03, balanced: 0.09, strict: 0.35 },
  "linkedin-post": { fast: 0.035, balanced: 0.12, strict: 0.45 },
  "validation-post": { fast: 0.04, balanced: 0.15, strict: 0.55 },
  newsletter: { fast: 0.045, balanced: 0.17, strict: 0.65 },
  "long-form-blog": { fast: 0.08, balanced: 0.28, strict: 1.1 },
  "architecture-post": { fast: 0.085, balanced: 0.3, strict: 1.2 }
};

export const CALIBRATION_CONTENT_TYPES = [
  "twitter-thread",
  "linkedin-post",
  "validation-post",
  "newsletter",
  "long-form-blog",
  "architecture-post"
] as const;

export const CALIBRATION_QUALITY_MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export const CALIBRATION_PLAN_TIERS = ["free", "starter", "pro", "enterprise"] as const;

export function estimateTheoreticalCostUsd(input: {
  readonly contentType: string;
  readonly qualityMode: QualityMode;
}): number {
  const row = THEORETICAL_COST_USD[input.contentType] ?? THEORETICAL_COST_USD["validation-post"];
  return row[input.qualityMode];
}
