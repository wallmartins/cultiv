import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { countLines, listTypeScriptFiles, PACKAGE_DIRS, ROOT } from "./shared.js";

const MAX_LINE_COUNT = 400;

// Remove entries as architecture-deepening phases complete.
const FILE_SIZE_ALLOWLIST = new Set<string>([]);

const FILE_SIZE_BASELINE = new Map<string, number>([]);

function isProductionTypeScriptFile(filePath: string): boolean {
  if (filePath.endsWith(".d.ts")) {
    return false;
  }

  if (filePath.endsWith(".gen.ts")) {
    return false;
  }

  if (filePath.includes("/i18n/")) {
    return false;
  }

  return true;
}

function toRelativePath(filePath: string): string {
  return relative(ROOT, filePath);
}

async function listProductionTypeScriptFiles(): Promise<string[]> {
  const targetDirs = [
    resolve(ROOT, "apps", "backend", "src"),
    ...PACKAGE_DIRS.map((dir) => resolve(ROOT, "packages", dir, "src"))
  ];

  const files: string[] = [];

  for (const dir of targetDirs) {
    for (const filePath of await listTypeScriptFiles(dir)) {
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
