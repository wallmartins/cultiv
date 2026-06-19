import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS } from "../../packages/feature-flags/src/defaults.js";

describe("generation compositor feature flag", () => {
  it("registers generation.compositor_v1 as disabled by default", () => {
    const flag = DEFAULT_FEATURE_FLAGS.find((entry) => entry.key === "generation.compositor_v1");

    expect(flag).toMatchObject({
      scope: "generation",
      enabled: false,
      defaultVariant: "off",
      variants: ["off", "on"],
      description: "Use Generation Compositor v1 instead of @phase1-legacy contentType resolver"
    });
  });
});
