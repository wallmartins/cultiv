import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import type { FeatureFlagDefinition } from "../../packages/feature-flags/src/types.js";
import { createFeatureFlagRegistry, listFeatureFlagKeys } from "../../packages/feature-flags/src/registry.js";

describe("feature-flags module", () => {
  it("imports registry helpers from registry.ts", () => {
    const registry = Effect.runSync(
      createFeatureFlagRegistry([
        {
          key: "content.language.refinement",
          scope: "content",
          enabled: true,
          defaultVariant: "on",
          variants: ["on", "off"]
        }
      ])
    );

    const typedFlag: FeatureFlagDefinition | undefined = registry.resolve("content.language.refinement");
    expect(typedFlag?.key).toBe("content.language.refinement");
    expect(listFeatureFlagKeys(registry)).toEqual(["content.language.refinement"]);
  });
});
