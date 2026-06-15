import { describe, expect, it } from "vitest";
import { resolveFormatInstructions } from "../../apps/backend/src/execution/skill-templates.js";

describe("linkedin-post word target", () => {
  it("targets feed-post length instead of article length", () => {
    const instructions = resolveFormatInstructions("linkedin-post", "draft");

    expect(instructions).toContain("130-220 words");
    expect(instructions).not.toContain("800-1200");
    expect(instructions).toMatch(/concise LinkedIn feed post/i);
  });
});
