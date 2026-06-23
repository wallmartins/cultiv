import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROOT,
  WORKSPACE_BLUR_PATTERN,
  WORKSPACE_DIR,
  WORKSPACE_GRADIENT_PATTERN,
  WORKSPACE_RADIUS_PATTERN,
  collectImprintBannedViolations,
  listSourceFiles
} from "./cartography-governance-shared.js";

describe("cartography migration complete", () => {
  it("contains no Imprint visual patterns in ui and web source", () => {
    expect(collectImprintBannedViolations()).toEqual([]);
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
