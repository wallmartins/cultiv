import { describe, expect, it } from "vitest";
import {
  buildTierPipelineVarianceGrid,
  countSweepRuns,
  resolveSweepProfile
} from "../../apps/backend/scripts/calibration/sweep-matrix.js";

describe("calibration sweep matrix", () => {
  it("builds tier-variance profile with balanced mode only", () => {
    const profile = resolveSweepProfile("tier-variance", 3);
    expect(profile.cells.every((cell) => cell.qualityMode === "balanced")).toBe(true);
    expect(profile.cells.some((cell) => cell.intent === "explain-deeply")).toBe(true);
    expect(countSweepRuns(profile.cells)).toBe(profile.cells.length * 3);
  });

  it("marks explain-deeply tiers as different legacy pipelines", () => {
    const cells = buildTierPipelineVarianceGrid(1);
    const explain = cells.filter((cell) => cell.intent === "explain-deeply");
    const legacyTypes = new Set(explain.map((cell) => cell.expectedLegacyContentType));
    expect(legacyTypes.size).toBe(3);
  });

  it("builds full profile with 54 cells for 6 intents", () => {
    const profile = resolveSweepProfile("full", 1);
    expect(profile.cells).toHaveLength(54);
  });
});
