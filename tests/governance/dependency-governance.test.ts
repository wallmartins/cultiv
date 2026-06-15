import { describe, expect, it } from "vitest";
import { readPackageJson } from "./shared.js";

describe("dependency governance", () => {
  it("enforces the allowed dependency directions for the current packages", async () => {
    const allowed = {
      contracts: new Set(["effect"]),
      domain: new Set(["@my-ai-orchestrator/contracts", "effect"]),
      core: new Set(["@my-ai-orchestrator/contracts", "effect"]),
      orchestrator: new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/core",
        "@my-ai-orchestrator/domain",
        "@my-ai-orchestrator/text-quality",
        "@my-ai-orchestrator/skills",
        "effect"
      ]),
      database: new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/domain",
        "effect"
      ]),
      "ai-adapters": new Set(["effect"]),
      "feature-flags": new Set(["@my-ai-orchestrator/contracts", "effect"]),
      payments: new Set(["@my-ai-orchestrator/contracts", "effect"]),
      "client-sdk": new Set(["@my-ai-orchestrator/contracts", "effect"]),
      skills: new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/domain",
        "effect",
        "franc"
      ]),
      "text-quality": new Set([
        "@my-ai-orchestrator/contracts",
        "@my-ai-orchestrator/skills",
        "effect"
      ])
    } as const;

    for (const [name, expected] of Object.entries(allowed)) {
      const pkg = await readPackageJson(name);
      for (const dependency of Object.keys(pkg.dependencies ?? {})) {
        expect(expected.has(dependency)).toBe(true);
      }
    }
  });
});
