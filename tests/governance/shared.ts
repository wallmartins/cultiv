import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect } from "vitest";

export const ROOT = process.cwd();

export const PACKAGE_DIRS = [
  "contracts",
  "domain",
  "core",
  "orchestrator",
  "skills",
  "text-quality",
  "database",
  "ai-adapters",
  "feature-flags",
  "payments",
  "client-sdk"
] as const;

export async function readPackageJson(name: string): Promise<Record<string, unknown>> {
  const filePath = resolve(ROOT, "packages", name, "package.json");
  return JSON.parse(await readFile(filePath, "utf-8")) as Record<string, unknown>;
}

export async function listTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".ts") && !fullPath.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

export function productPathTargets(): readonly string[] {
  return [
    resolve(ROOT, "apps", "backend", "src"),
    ...PACKAGE_DIRS.map((dir) => resolve(ROOT, "packages", dir, "src"))
  ];
}

export async function expectNoImportsMatching(
  targets: readonly string[],
  patterns: readonly RegExp[]
): Promise<void> {
  for (const target of targets) {
    for (const filePath of await listTypeScriptFiles(target)) {
      const source = await readFile(filePath, "utf-8");

      for (const pattern of patterns) {
        expect(source).not.toMatch(pattern);
      }
    }
  }
}
