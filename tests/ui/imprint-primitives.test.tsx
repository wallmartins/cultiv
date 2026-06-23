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
    expect(svg?.innerHTML).toMatch(/C24 34 37 19 52 11/);
  });

  it("uses balanced variant with ring and signature arc at medium sizes", () => {
    const { container } = render(<PressMark size={48} />);
    const svg = container.querySelector("svg");
    expect(svg?.innerHTML).toMatch(/M32 6 A26 26 0 1 1 31\.99 6/);
    expect(svg?.innerHTML).toMatch(/C21 40 27 31 33 25/);
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
