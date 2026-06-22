import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return startDir;
    }

    dir = parent;
  }
}

const repoRoot = findMonorepoRoot(dirname(fileURLToPath(import.meta.url)));

/** Resolve CLI paths relative to the monorepo root (not apps/backend cwd). */
export function resolveCalibrationRepoPath(pathArg: string): string {
  return pathArg.startsWith("/") ? pathArg : resolve(repoRoot, pathArg);
}

export function calibrationRepoRoot(): string {
  return repoRoot;
}
