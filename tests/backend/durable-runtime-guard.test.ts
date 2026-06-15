import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const backendSrcRoot = join(process.cwd(), "apps/backend/src");

const forbiddenPatterns = [
  { label: "idempotencyCache in execution service", pattern: /idempotencyCache\s*=\s*new Map/ },
  { label: "rateLimitStore in waitlist", pattern: /rateLimitStore\s*=\s*new Map/ }
];

const allowlistedPaths = new Set([
  "job-store.ts",
  "execution/idempotency-store.ts",
  "production/rate-limiter.ts",
  "product/usage-policy.ts"
]);

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const relativePath = fullPath.slice(backendSrcRoot.length + 1);

    if (statSync(fullPath).isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts")) {
      files.push(relativePath);
    }
  }

  return files;
}

describe("durable runtime in-memory guard", () => {
  it("does not introduce forbidden business-state Maps outside the allowlist", () => {
    const violations: string[] = [];

    for (const file of listSourceFiles(backendSrcRoot)) {
      if (allowlistedPaths.has(file)) {
        continue;
      }

      const source = readFileSync(join(backendSrcRoot, file), "utf8");
      for (const { label, pattern } of forbiddenPatterns) {
        if (pattern.test(source)) {
          violations.push(`${file}: ${label}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
