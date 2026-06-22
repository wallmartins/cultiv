import { describe, expect, it } from "vitest";
import { motionTokens } from "../../packages/ui/src/tokens/motion.js";

describe("imprint motion tokens", () => {
  it("defines press stamp duration", () => {
    expect(motionTokens.press.duration).toBe(0.45);
  });

  it("defines slow reveal for sections", () => {
    expect(motionTokens.reveal.duration).toBe(0.6);
    expect(motionTokens.reveal.y).toBe(12);
  });
});
