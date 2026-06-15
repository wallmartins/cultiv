import { describe, expect, it } from "vitest";
import { extractImports, getBackendFileContent } from "./parity.shared.js";

describe("M2-27: Audit - No Legacy Dependencies", () => {
  it("backend imports only from @my-ai-orchestrator packages and effect", () => {
    const allowedPrefixes = [
      "@my-ai-orchestrator/",
      "effect",
      "hono",
      "@hono/",
      "node:",
      "kysely",
      "pg",
      "dotenv",
      "./",
      "../"
    ];

    const backendFiles = [
      "src/app.ts",
      "src/bootstrap.ts",
      "src/config.ts",
      "src/errors.ts",
      "src/execution.ts",
      "src/execution/billing.ts",
      "src/execution/quality.ts",
      "src/execution/runtime.ts",
      "src/execution/skills.ts",
      "src/http.ts",
      "src/job-store.ts",
      "src/main.ts",
      "src/memory.ts",
      "src/product.ts",
      "src/product/persistence.ts",
      "src/product/services.ts",
      "src/product/service-dependencies.ts",
      "src/product/service-types.ts",
      "src/product/persistence-types.ts",
      "src/product/usage-policy-types.ts",
      "src/product/types.ts",
      "src/product/usage-policy.ts",
      "src/worker.ts"
    ];

    for (const file of backendFiles) {
      const content = getBackendFileContent(file);
      const imports = extractImports(content);

      for (const source of imports) {
        const isAllowed = allowedPrefixes.some((prefix) =>
          source.startsWith(prefix)
        );
        expect(isAllowed || source.startsWith(".")).toBe(true);
      }
    }
  });
});
