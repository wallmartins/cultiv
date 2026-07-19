import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { normalizeText } from "./quality-normalization.js";

// Per-step progress heuristic (length + step count + mode) fed back into the next step's
// prompt as previousScore. NOT candidate quality — see text-quality's scorer for the finalScore blend.
export function estimateStepProgressScore(content: string, stepCount: number, qualityMode: QualityMode): number {
  const textLength = normalizeText(content).length;
  const lengthScore = Math.min(50, Math.round(textLength / 28));
  const structureScore = Math.min(30, stepCount * 6);
  const qualityScore = qualityMode === "fast" ? 6 : qualityMode === "balanced" ? 12 : 18;

  return Math.max(0, Math.min(100, lengthScore + structureScore + qualityScore));
}
