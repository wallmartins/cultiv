import { loadBackendEnvironment } from "../../src/config/config.js";

/** Load repo `.env` for operator scripts even when NODE_ENV=production on VPS. */
export function loadCalibrationEnvironment(): void {
  loadBackendEnvironment({ mode: "local" });
}
