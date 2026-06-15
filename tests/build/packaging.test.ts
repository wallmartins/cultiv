import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8")) as {
  readonly name: string;
  readonly private?: boolean;
  readonly scripts: Record<string, string>;
  readonly engines?: { readonly node?: string };
};

describe("monorepo root package.json", () => {
  it("is a private workspace root", () => {
    expect(pkg.private).toBe(true);
    expect(pkg.name).toBe("cultiv");
  });

  it("exposes workspace orchestration scripts", () => {
    expect(pkg.scripts.test).toBe("vitest run");
    expect(pkg.scripts.build).toContain("pnpm -r");
    expect(pkg.scripts.lint).toContain("pnpm -r");
  });

  it("specifies node engine requirement", () => {
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines?.node).toMatch(/>=22/);
  });
});
