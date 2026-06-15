import { describe, expect, it } from "vitest";
import { sortAppSelectOptions } from "../../apps/web/src/platform/ui/app-select-utils.js";

describe("sortAppSelectOptions", () => {
  it("sorts options by localized label", () => {
    const sorted = sortAppSelectOptions("pt", [
      { value: "z", label: "Zebra" },
      { value: "a", label: "Árvore" },
      { value: "m", label: "Manga" }
    ]);

    expect(sorted.map((option) => option.label)).toEqual(["Árvore", "Manga", "Zebra"]);
  });
});
