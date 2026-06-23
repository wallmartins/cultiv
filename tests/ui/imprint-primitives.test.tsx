/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../packages/ui/src/primitives/Button.js";
import { PaperSurface } from "../../packages/ui/src/primitives/PaperSurface.js";
import { PressMark } from "../../packages/ui/src/primitives/PressMark.js";
import { ReadingSurface } from "../../packages/ui/src/primitives/ReadingSurface.js";

describe("Button", () => {
  it("primary variant uses terracotta pigment", () => {
    render(<Button variant="primary">Join</Button>);
    expect(screen.getByRole("button").className).toMatch(/bg-pigment-terracotta/);
  });
});

describe("PressMark", () => {
  it("renders accessible logo mark", () => {
    render(<PressMark />);
    expect(screen.getByRole("img", { name: /cultiv/i })).toBeInTheDocument();
  });

  it("uses compact variant without stamp pad at small sizes", () => {
    const { container } = render(<PressMark size={24} />);
    const svg = container.querySelector("svg");
    expect(svg?.innerHTML).not.toMatch(/M9 10 L55 8/);
    expect(svg?.innerHTML).toMatch(/C22 30 36 18 52 11/);
  });

  it("uses balanced variant with stamp pad and signature arc at medium sizes", () => {
    const { container } = render(<PressMark size={48} />);
    const svg = container.querySelector("svg");
    expect(svg?.innerHTML).toMatch(/M9 10 L55 8/);
    expect(svg?.innerHTML).toMatch(/C19 36 26 28 34 22/);
  });
});

describe("PaperSurface", () => {
  it("has imprint-grain and press-edge classes", () => {
    render(<PaperSurface data-testid="paper-surface">Content</PaperSurface>);
    const el = screen.getByTestId("paper-surface");
    expect(el.className).toMatch(/imprint-grain/);
    expect(el.className).toMatch(/press-edge/);
  });
});

describe("ReadingSurface", () => {
  it("renders children with ui-type-reading class on inner wrapper", () => {
    render(<ReadingSurface>Sample output</ReadingSurface>);
    const el = screen.getByText("Sample output");
    expect(el.className).toMatch(/ui-type-reading/);
  });
});
