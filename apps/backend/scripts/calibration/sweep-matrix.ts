import type { GenerationLengthTier, PlanSignature, QualityMode, RhetoricalMode } from "@my-ai-orchestrator/contracts";
import { pickBasePreset } from "../../src/product/generation/compositor/expression.js";

export interface CalibrationSweepCell {
  readonly id: string;
  readonly rhetoricalMode: RhetoricalMode;
  readonly lengthTier: GenerationLengthTier;
  readonly qualityMode: QualityMode;
  readonly repeats: number;
  readonly expectedPlanSignature: PlanSignature;
}

export interface CalibrationSweepProfile {
  readonly id: string;
  readonly description: string;
  readonly cells: readonly CalibrationSweepCell[];
}

const RHETORICAL_MODES: readonly RhetoricalMode[] = ["expound", "narrate", "argue", "instruct", "promote"];

const TIERS: readonly GenerationLengthTier[] = ["short", "medium", "long"];
const MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

function resolvePlanSignature(rhetoricalMode: RhetoricalMode, lengthTier: GenerationLengthTier): PlanSignature {
  return pickBasePreset({ rhetoricalMode, lengthTier });
}

export function buildFullRhetoricalModeTierModeGrid(repeats: number): readonly CalibrationSweepCell[] {
  const cells: CalibrationSweepCell[] = [];

  for (const rhetoricalMode of RHETORICAL_MODES) {
    for (const lengthTier of TIERS) {
      for (const qualityMode of MODES) {
        cells.push({
          id: `${rhetoricalMode}:${lengthTier}:${qualityMode}`,
          rhetoricalMode,
          lengthTier,
          qualityMode,
          repeats,
          expectedPlanSignature: resolvePlanSignature(rhetoricalMode, lengthTier)
        });
      }
    }
  }

  return cells;
}

/** Cells where length tier changes the resolved compositor plan signature (proxy for tier-driven execution). */
export function buildTierPipelineVarianceGrid(repeats: number): readonly CalibrationSweepCell[] {
  const byMode = new Map<RhetoricalMode, Set<PlanSignature>>();
  for (const rhetoricalMode of RHETORICAL_MODES) {
    byMode.set(rhetoricalMode, new Set(TIERS.map((tier) => resolvePlanSignature(rhetoricalMode, tier))));
  }

  const cells: CalibrationSweepCell[] = [];
  for (const rhetoricalMode of RHETORICAL_MODES) {
    if ((byMode.get(rhetoricalMode)?.size ?? 0) <= 1) {
      continue;
    }

    for (const lengthTier of TIERS) {
      cells.push({
        id: `${rhetoricalMode}:${lengthTier}:balanced`,
        rhetoricalMode,
        lengthTier,
        qualityMode: "balanced",
        repeats,
        expectedPlanSignature: resolvePlanSignature(rhetoricalMode, lengthTier)
      });
    }
  }

  return cells;
}

export function resolveSweepProfile(profileId: string, repeats: number): CalibrationSweepProfile {
  switch (profileId) {
    case "tier-variance":
      return {
        id: profileId,
        description: "Rhetorical mode × tier (balanced) where tier changes plan signature — Option B viability proxy",
        cells: buildTierPipelineVarianceGrid(repeats)
      };
    case "full":
    default:
      return {
        id: profileId,
        description: "All rhetorical mode × tier × qualityMode combinations",
        cells: buildFullRhetoricalModeTierModeGrid(repeats)
      };
  }
}

export function countSweepRuns(cells: readonly CalibrationSweepCell[]): number {
  return cells.reduce((total, cell) => total + cell.repeats, 0);
}
