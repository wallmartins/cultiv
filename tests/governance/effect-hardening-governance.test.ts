import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, listTypeScriptFiles } from "./shared.js";
const TARGET_PACKAGES = [
  "contracts",
  "core",
  "ai-adapters",
  "database",
  "feature-flags",
  "payments",
  "skills",
  "orchestrator"
];

const CLIENT_SDK_BOUNDARY_FILES = new Set([
  "client.ts",
  "execution-watch.ts",
  "sse-parser.ts",
  "config.ts"
]);

describe("effect hardening governance", () => {
  it("blocks sync decode, helper runtime execution, generic throws, and Promise contracts in Effect packages", async () => {
    for (const pkg of TARGET_PACKAGES) {
      for (const filePath of await listTypeScriptFiles(resolve(ROOT, "packages", pkg, "src"))) {
        const source = await readFile(filePath, "utf-8");

        expect(source).not.toMatch(/throw new Error/);
        expect(source).not.toMatch(/Schema\.decodeUnknownSync/);
        expect(source).not.toMatch(/Effect\.runPromise/);
        expect(source).not.toMatch(/Effect\.runSync/);
        expect(source).not.toMatch(/:\s*Promise</);
        expect(source).not.toMatch(/=>\s*Promise</);
      }
    }
  });

  it("keeps client-sdk internals Effect-first while allowing the Promise boundary surface", async () => {
    for (const filePath of await listTypeScriptFiles(resolve(ROOT, "packages", "client-sdk", "src"))) {
      const source = await readFile(filePath, "utf-8");
      const fileName = filePath.split("/").pop() ?? "";

      expect(source).not.toMatch(/throw new Error/);
      expect(source).not.toMatch(/Schema\.decodeUnknownSync/);

      if (!CLIENT_SDK_BOUNDARY_FILES.has(fileName)) {
        expect(source).not.toMatch(/Effect\.runPromise/);
        expect(source).not.toMatch(/Effect\.runSync/);
      }
    }
  });
});
