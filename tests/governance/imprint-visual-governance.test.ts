import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LEGACY_PATTERNS = [
  /Playfair Display/,
  /Caveat/,
  /font-handwritten/,
  /ui-type-handwritten/,
  /BotanicalTree/,
  /BotanicalStem/,
  /FallingLeavesLayer/,
  /editorial-rule/,
  /#6b9080/, // legacy moss
  /#d4a843/ // legacy golden
];

const SCAN_ROOTS = ["packages/ui/src", "apps/web/src"] as const;
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

function listSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const entryStat = statSync(fullPath);

    if (entryStat.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    const extension = fullPath.slice(fullPath.lastIndexOf("."));
    if (SCAN_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("imprint visual governance", () => {
  it("contains no legacy visual patterns in ui and web source", () => {
    const files = SCAN_ROOTS.flatMap((root) => listSourceFiles(root));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const pattern of LEGACY_PATTERNS) {
        if (pattern.test(content)) violations.push(`${file}: ${pattern}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
