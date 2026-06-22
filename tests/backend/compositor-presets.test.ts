import { describe, expect, it } from "vitest";
import { COMPOSITOR_PRESETS, getPreset, resolveDominantPlanSignature } from "../../apps/backend/src/product/generation/compositor/presets.js";

describe("compositor presets", () => {
  it("defines four presets with sanitize terminal step", () => {
    expect(Object.keys(COMPOSITOR_PRESETS)).toHaveLength(4);
    for (const preset of Object.values(COMPOSITOR_PRESETS)) {
      expect(preset.steps.at(-1)?.skill).toBe("sanitize");
    }
  });

  it("long-piece includes research and outline", () => {
    const names = getPreset("long-piece").steps.map((s) => s.name);
    expect(names).toContain("research");
    expect(names).toContain("outline");
  });

  it("resolveDominantPlanSignature picks base preset when steps match one bucket", () => {
    const steps = getPreset("edition-piece").steps;
    expect(resolveDominantPlanSignature(steps, "edition-piece")).toBe("edition-piece");
  });

  it("resolveDominantPlanSignature attributes planner-only steps to the base preset", () => {
    const steps = [
      ...getPreset("edition-piece").steps,
      {
        name: "structure",
        skill: "structure",
        execution: "llm" as const,
        routingProfile: "premium-llm"
      }
    ];
    expect(resolveDominantPlanSignature(steps, "edition-piece")).toBe("edition-piece");
  });
});
