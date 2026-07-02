import { describe, expect, it } from "vitest";
import {
  formatIntentWordTargetLine,
  resolveContextWordTarget,
  resolveFormatInstructions
} from "../../apps/backend/src/execution/skill-templates.js";

describe("word target prompt", () => {
  it("formats the intent word target line", () => {
    expect(formatIntentWordTargetLine({ min: 150, max: 400 })).toBe(
      "Target length: between 150 and 400 words."
    );
  });

  it("includes word range in draft format instructions when context wordTarget is provided", () => {
    const instructions = resolveFormatInstructions("linkedin-post", "draft", { min: 150, max: 400 });

    expect(instructions).toContain("Target length: between 150 and 400 words.");
    expect(instructions).not.toContain("130-220");
  });

  it("includes word range in refine format instructions when context wordTarget is provided", () => {
    const instructions = resolveFormatInstructions("linkedin-post", "refine", { min: 400, max: 1200 });

    expect(instructions).toContain("Target length: between 400 and 1200 words.");
  });

  it("falls back to format-based target when context wordTarget is absent", () => {
    const instructions = resolveFormatInstructions("linkedin-post", "draft");

    expect(instructions).toContain("130-300 words");
  });

  it("includes word range in expand format instructions when context wordTarget is provided", () => {
    const instructions = resolveFormatInstructions("linkedin-post", "expand", { min: 180, max: 260 });

    expect(instructions).toContain("Target length: between 180 and 260 words.");
  });

  it("does not override word target for non-draft/refine/expand steps", () => {
    const instructions = resolveFormatInstructions("linkedin-post", "hook", { min: 150, max: 400 });

    expect(instructions).not.toContain("between 150 and 400");
    expect(instructions).toContain("130-300 words");
  });

  it("resolves wordTarget from runtime inputs", () => {
    expect(resolveContextWordTarget({ wordTarget: { min: 150, max: 400 } })).toEqual({
      min: 150,
      max: 400
    });
    expect(
      resolveContextWordTarget({ context: { wordTarget: { min: 1200, max: 3500 } } })
    ).toEqual({
      min: 1200,
      max: 3500
    });
  });
});
