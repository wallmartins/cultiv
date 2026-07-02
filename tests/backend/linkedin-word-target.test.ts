import { describe, expect, it } from "vitest";
import { resolveFormatInstructions } from "../../apps/backend/src/execution/skill-templates.js";
import { describeOutputWordTarget, resolveOutputWordTargetForFormatName } from "../../packages/text-quality/src/format/word-targets.js";

describe("linkedin-post word target", () => {
  it("targets feed-post length instead of article length", () => {
    const target = resolveOutputWordTargetForFormatName("linkedin-post");
    const instructions = resolveFormatInstructions("linkedin-post", "draft");

    expect(instructions).toContain(describeOutputWordTarget(target));
    expect(instructions).not.toContain("800-1200");
    expect(instructions).toMatch(/concise LinkedIn feed post/i);
  });
});
