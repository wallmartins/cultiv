import { loadBackendEnvironment } from "../../src/config/config.js";
import { calibrationRepoRoot } from "./resolve-repo-path.js";

/** Load monorepo-root `.env` for operator scripts even when NODE_ENV=production on VPS. */
export function loadCalibrationEnvironment(): void {
  loadBackendEnvironment({
    mode: "local",
    cwd: calibrationRepoRoot()
  });
}
