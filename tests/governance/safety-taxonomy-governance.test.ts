import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./shared.js";

describe("safety taxonomy governance", () => {
  it("keeps internal override routes on canonical taxonomy schemas", async () => {
    const routePath = resolve(ROOT, "apps/backend/src/routes/internal-override-routes.ts");
    const source = await readFile(routePath, "utf-8");

    expect(source).toMatch(/from "\.\.\/safety\/safety-taxonomy-schemas\.js"/);
    expect(source).toMatch(/OperationalOverrideTargetFamilySchema/);
    expect(source).toMatch(/OperationalOverrideTargetBoundarySchema/);
    expect(source).toMatch(/SafetyClassificationCategorySchema/);
    expect(source).toMatch(/SafetyDecisionOutcomeSchema/);
    expect(source).not.toMatch(/targetFamily:\s*Schema\.Literal\(/);
    expect(source).not.toMatch(/boundary:\s*Schema\.Literal\(/);
    expect(source).not.toMatch(/categories:\s*Schema\.Array\(\s*Schema\.Literal\(/);
    expect(source).not.toMatch(/targetOutcome:\s*Schema\.Literal\(/);
  });
});
