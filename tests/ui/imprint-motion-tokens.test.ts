import { describe, expect, it } from "vitest";
import { motionTokens } from "../../packages/ui/src/tokens/motion.js";

describe("cartography motion tokens", () => {
  it("defines premium contained reveal duration", () => {
    expect(motionTokens.duration.reveal).toBe(400);
  });

  it("defines reveal distance for sections", () => {
    expect(motionTokens.distance.revealY).toBe(12);
  });
});
