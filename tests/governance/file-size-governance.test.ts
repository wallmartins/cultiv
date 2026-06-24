import { readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { countLines, listTypeScriptFiles, PACKAGE_DIRS, ROOT } from "./shared.js";

const MAX_LINE_COUNT = 400;

// Remove entries as architecture-deepening phases complete.
const FILE_SIZE_ALLOWLIST = new Set<string>([
  "apps/web/src/app/voice/components/VoiceDashboard.tsx"
]);

const FILE_SIZE_BASELINE = new Map<string, number>([
  ["apps/web/src/app/voice/components/VoiceDashboard.tsx", 433]
]);

function isProductionTypeScriptFile(filePath: string): boolean {
  if (filePath.endsWith(".d.ts")) {
    return false;
  }

  if (filePath.endsWith(".gen.ts")) {
    return false;
  }

  if (filePath.endsWith("routeTree.gen.ts")) {
    return false;
  }

  if (filePath.includes("/i18n/")) {
    return false;
  }

  return true;
}

async function listTypeScriptAndTsxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptAndTsxFiles(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) &&
      !fullPath.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRelativePath(filePath: string): string {
  return relative(ROOT, filePath);
}

async function listProductionTypeScriptFiles(): Promise<string[]> {
  const webSrcDir = resolve(ROOT, "apps", "web", "src");
  const targetDirs = [
    resolve(ROOT, "apps", "backend", "src"),
    webSrcDir,
    ...PACKAGE_DIRS.map((dir) => resolve(ROOT, "packages", dir, "src"))
  ];

  const files: string[] = [];

  for (const dir of targetDirs) {
    const listFiles = dir === webSrcDir ? listTypeScriptAndTsxFiles : listTypeScriptFiles;

    for (const filePath of await listFiles(dir)) {
      if (isProductionTypeScriptFile(filePath)) {
        files.push(filePath);
      }
    }
  }

  return files;
}

describe("file size governance", () => {
  it("keeps production TypeScript files within the line budget", async () => {
    const violations: string[] = [];

    for (const filePath of await listProductionTypeScriptFiles()) {
      const relPath = toRelativePath(filePath);

      if (FILE_SIZE_ALLOWLIST.has(relPath)) {
        continue;
      }

      const lineCount = await countLines(filePath);

      if (lineCount > MAX_LINE_COUNT) {
        violations.push(`${relPath} (${lineCount} lines)`);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("does not allow allowlisted files to grow further", async () => {
    const regressions: string[] = [];

    for (const [relPath, baseline] of FILE_SIZE_BASELINE) {
      const lineCount = await countLines(resolve(ROOT, relPath));

      if (lineCount > baseline) {
        regressions.push(`${relPath}: ${lineCount} lines (baseline ${baseline})`);
      }
    }

    expect(regressions, regressions.join("\n")).toEqual([]);
  });
});
