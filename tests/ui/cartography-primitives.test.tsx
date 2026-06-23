/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompassMark } from "../../packages/ui/src/primitives/CompassMark.js";

describe("CompassMark", () => {
  it("renders role=img with aria-label Cultiv", () => {
    render(<CompassMark />);
    expect(screen.getByRole("img", { name: "Cultiv" })).toBeInTheDocument();
  });

  it("renders four cardinal elements at size 32", () => {
    const { container } = render(<CompassMark size={32} />);
    const cardinals = container.querySelectorAll("[data-cardinal]");
    expect(cardinals).toHaveLength(4);
    expect(Array.from(cardinals).map((el) => el.getAttribute("data-cardinal"))).toEqual(
      expect.arrayContaining(["north", "east", "south", "west"])
    );
  });

  it("uses deep-blue color by default", () => {
    const { container } = render(<CompassMark size={32} />);
    const root = container.querySelector("[data-compass-color]");
    expect(root?.getAttribute("data-compass-color")).toBe("deep-blue");
    const stroke = container.querySelector("[data-cardinal='north']");
    expect(stroke?.getAttribute("stroke")).toBe("var(--color-deep-blue)");
  });
});
