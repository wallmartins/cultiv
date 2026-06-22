import { describe, expect, it } from "vitest";
import {
  calibrationRepoRoot,
  resolveCalibrationRepoPath
} from "../../apps/backend/scripts/calibration/resolve-repo-path.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

describe("resolveCalibrationRepoPath", () => {
  it("resolves paths relative to monorepo root", () => {
    const root = calibrationRepoRoot();
    expect(existsSync(resolve(root, "pnpm-workspace.yaml"))).toBe(true);
    expect(resolveCalibrationRepoPath("docs/superpowers/reports/calibration-jobs-sweep.json")).toBe(
      resolve(root, "docs/superpowers/reports/calibration-jobs-sweep.json")
    );
  });

  it("keeps absolute paths unchanged", () => {
    expect(resolveCalibrationRepoPath("/tmp/jobs.json")).toBe("/tmp/jobs.json");
  });
});
