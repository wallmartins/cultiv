import { describe, expect, it } from "vitest";
import { selectArgumentLenses } from "../src/product/generation/argument-lenses.js";

describe("selectArgumentLenses — MODE_LENS_PRIORITY (C-6)", () => {
  it("puts the mode's priority lenses first", () => {
    expect(selectArgumentLenses({ rhetoricalMode: "argue", maxLenses: 2 })).toEqual([
      "operational",
      "organizational"
    ]);
    expect(selectArgumentLenses({ rhetoricalMode: "promote", maxLenses: 2 })).toEqual([
      "psychological",
      "financial"
    ]);
  });

  it("falls back to briefing keywords + default order for modes without a priority row", () => {
    expect(selectArgumentLenses({ rhetoricalMode: "narrate", maxLenses: 2 })).toEqual([
      "operational",
      "psychological"
    ]);
    expect(
      selectArgumentLenses({ rhetoricalMode: "narrate", briefing: "our team career growth", maxLenses: 2 })
    ).toEqual(["team", "career"]);
  });

  it("keeps briefing keywords contributing after the mode priority", () => {
    expect(
      selectArgumentLenses({ rhetoricalMode: "expound", briefing: "the budget impact", maxLenses: 3 })
    ).toEqual(["operational", "temporal", "financial"]);
  });
});
