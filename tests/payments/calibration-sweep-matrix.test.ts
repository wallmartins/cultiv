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
    expect(profile.cells.some((cell) => cell.rhetoricalMode === "expound")).toBe(true);
    expect(countSweepRuns(profile.cells)).toBe(profile.cells.length * 3);
  });

  it("marks expound tiers as different plan signatures", () => {
    const cells = buildTierPipelineVarianceGrid(1);
    const expound = cells.filter((cell) => cell.rhetoricalMode === "expound");
    const planSignatures = new Set(expound.map((cell) => cell.expectedPlanSignature));
    expect(planSignatures.size).toBe(3);
  });

  it("builds full profile with 45 cells for 5 rhetorical modes", () => {
    const profile = resolveSweepProfile("full", 1);
    expect(profile.cells).toHaveLength(45);
  });
});
