import type { GenerationIntent, GenerationLengthTier, QualityMode } from "@my-ai-orchestrator/contracts";
import { resolvePhase1LegacyContentTypeId } from "@my-ai-orchestrator/contracts";

export interface CalibrationSweepCell {
  readonly id: string;
  readonly intent: GenerationIntent;
  readonly lengthTier: GenerationLengthTier;
  readonly qualityMode: QualityMode;
  readonly repeats: number;
  readonly expectedLegacyContentType: string;
}

export interface CalibrationSweepProfile {
  readonly id: string;
  readonly description: string;
  readonly cells: readonly CalibrationSweepCell[];
}

const INTENTS: readonly GenerationIntent[] = [
  "share-idea",
  "explain-deeply",
  "engage-audience",
  "tell-story",
  "update-subscribers",
  "document-decision"
];

const TIERS: readonly GenerationLengthTier[] = ["short", "medium", "long"];
const MODES: readonly QualityMode[] = ["fast", "balanced", "strict"];

export function buildFullIntentTierModeGrid(repeats: number): readonly CalibrationSweepCell[] {
  const cells: CalibrationSweepCell[] = [];

  for (const intent of INTENTS) {
    for (const lengthTier of TIERS) {
      for (const qualityMode of MODES) {
        cells.push({
          id: `${intent}:${lengthTier}:${qualityMode}`,
          intent,
          lengthTier,
          qualityMode,
          repeats,
          expectedLegacyContentType: resolvePhase1LegacyContentTypeId(intent, lengthTier)
        });
      }
    }
  }

  return cells;
}

/** Cells where length tier changes the resolved legacy pipeline (proxy for tier-driven execution). */
export function buildTierPipelineVarianceGrid(repeats: number): readonly CalibrationSweepCell[] {
  const byIntent = new Map<GenerationIntent, Set<string>>();
  for (const intent of INTENTS) {
    byIntent.set(
      intent,
      new Set(TIERS.map((tier) => resolvePhase1LegacyContentTypeId(intent, tier)))
    );
  }

  const cells: CalibrationSweepCell[] = [];
  for (const intent of INTENTS) {
    if ((byIntent.get(intent)?.size ?? 0) <= 1) {
      continue;
    }

    for (const lengthTier of TIERS) {
      cells.push({
        id: `${intent}:${lengthTier}:balanced`,
        intent,
        lengthTier,
        qualityMode: "balanced",
        repeats,
        expectedLegacyContentType: resolvePhase1LegacyContentTypeId(intent, lengthTier)
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
        description: "Intent × tier (balanced) where tier changes legacy pipeline — Option B viability proxy",
        cells: buildTierPipelineVarianceGrid(repeats)
      };
    case "full":
    default:
      return {
        id: profileId,
        description: "All intent × tier × qualityMode combinations",
        cells: buildFullIntentTierModeGrid(repeats)
      };
  }
}

export function countSweepRuns(cells: readonly CalibrationSweepCell[]): number {
  return cells.reduce((total, cell) => total + cell.repeats, 0);
}
