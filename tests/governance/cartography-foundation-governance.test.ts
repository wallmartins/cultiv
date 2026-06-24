import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CARTOGRAPHY_INDEX_EXPORTS,
  CARTOGRAPHY_PRIMITIVE_FILES,
  CARTOGRAPHY_REQUIRED_IN_THEME,
  ROOT,
  THEME_CSS_PATH,
  UI_INDEX_PATH,
  WORKSPACE_BLUR_PATTERN,
  WORKSPACE_DIR,
  WORKSPACE_GRADIENT_PATTERN,
  WORKSPACE_RADIUS_PATTERN,
  listSourceFiles,
  readRepoFile,
  repoFileExists
} from "./cartography-governance-shared.js";

describe("cartography foundation governance", () => {
  it("defines required Cartography tokens in theme.css", () => {
    const themeCss = readRepoFile(THEME_CSS_PATH);
    const missing = CARTOGRAPHY_REQUIRED_IN_THEME.filter((pattern) => !pattern.test(themeCss));

    expect(missing.map(String)).toEqual([]);
  });

  it("includes core Cartography primitive modules", () => {
    const missing = CARTOGRAPHY_PRIMITIVE_FILES.filter((filePath) => !repoFileExists(filePath));

    expect(missing).toEqual([]);
  });

  it("exports Cartography primitives from packages/ui", () => {
    const indexSource = readRepoFile(UI_INDEX_PATH);
    const missing = CARTOGRAPHY_INDEX_EXPORTS.filter((exportName) => !indexSource.includes(exportName));

    expect(missing).toEqual([]);
  });

  it("uses no backdrop-blur in workspace chrome (app/**)", () => {
    const files = listSourceFiles(join(ROOT, WORKSPACE_DIR));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (WORKSPACE_BLUR_PATTERN.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("uses no large SaaS radii in workspace UI (app/**)", () => {
    const files = listSourceFiles(join(ROOT, WORKSPACE_DIR));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (WORKSPACE_RADIUS_PATTERN.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it("uses no gradients in workspace functional UI (app/**)", () => {
    const files = listSourceFiles(join(ROOT, WORKSPACE_DIR));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (WORKSPACE_GRADIENT_PATTERN.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
