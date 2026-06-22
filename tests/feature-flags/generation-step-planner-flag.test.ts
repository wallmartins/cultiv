import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS } from "../../packages/feature-flags/src/defaults.js";

describe("generation step planner feature flag", () => {
  it("registers generation.step_planner_v1 as disabled by default", () => {
    const flag = DEFAULT_FEATURE_FLAGS.find((entry) => entry.key === "generation.step_planner_v1");

    expect(flag).toMatchObject({
      scope: "generation",
      enabled: false,
      defaultVariant: "off",
      variants: ["off", "on"],
      description: "Apply briefing-driven StepPlanner patches after compositor planning"
    });
  });
});
