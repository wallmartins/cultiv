import { describe, expect, it } from "vitest";
import { resolveFormatInstructions } from "../../apps/backend/src/execution/skill-templates.js";
import {
  describeOutputWordTarget,
  resolveOutputWordTarget,
  resolveOutputWordTargetForFormatName
} from "../../packages/text-quality/src/format/output-length.js";

describe("unified output word targets", () => {
  it("uses the same linkedin range in prompts and quality scoring", () => {
    const target = resolveOutputWordTargetForFormatName("linkedin-post");
    const instructions = resolveFormatInstructions("linkedin-post", "draft");

    expect(target).toEqual({ minWords: 130, maxWords: 300, idealWords: 200 });
    expect(instructions).toContain(describeOutputWordTarget(target));
    expect(instructions).not.toContain("800-1200");
  });

  it("resolves linkedin targets from pipeline request metadata", () => {
    const target = resolveOutputWordTarget({
      pipeline: { name: "linkedin-post", steps: [] },
      inputs: { briefing: "Test" }
    });

    expect(target.idealWords).toBe(200);
  });
});
