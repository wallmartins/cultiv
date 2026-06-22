/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaperSurface } from "../../packages/ui/src/primitives/PaperSurface.js";
import { PressMark } from "../../packages/ui/src/primitives/PressMark.js";
import { ReadingSurface } from "../../packages/ui/src/primitives/ReadingSurface.js";

describe("PressMark", () => {
  it("renders accessible logo mark", () => {
    render(<PressMark />);
    expect(screen.getByRole("img", { name: /cultiv/i })).toBeInTheDocument();
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
