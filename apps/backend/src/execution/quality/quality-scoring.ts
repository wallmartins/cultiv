import type { QualityMode } from "@my-ai-orchestrator/contracts";
import { normalizeText } from "./quality-normalization.js";

export function scoreExecution(content: string, stepCount: number, qualityMode: QualityMode): number {
  const textLength = normalizeText(content).length;
  const lengthScore = Math.min(50, Math.round(textLength / 28));
  const structureScore = Math.min(30, stepCount * 6);
  const qualityScore = qualityMode === "fast" ? 6 : qualityMode === "balanced" ? 12 : 18;

  return Math.max(0, Math.min(100, lengthScore + structureScore + qualityScore));
}
