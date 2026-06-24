/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../../packages/ui/src/primitives/Button.js";
import { CartographySurface } from "../../packages/ui/src/primitives/CartographySurface.js";
import { CompassMark } from "../../packages/ui/src/primitives/CompassMark.js";
import { CoordinateLabel } from "../../packages/ui/src/primitives/CoordinateLabel.js";
import { ExpeditionCard } from "../../packages/ui/src/primitives/ExpeditionCard.js";
import { Input } from "../../packages/ui/src/primitives/Input.js";
import { LogbookProse } from "../../packages/ui/src/primitives/LogbookProse.js";
import { Text } from "../../packages/ui/src/primitives/Text.js";

describe("CartographySurface", () => {
  it("applies cartography-grain class", () => {
    render(<CartographySurface data-testid="surface">X</CartographySurface>);
    expect(screen.getByTestId("surface").className).toMatch(/cartography-grain/);
  });
});

describe("CoordinateLabel", () => {
  it("renders §index · label in mono typography", () => {
    render(<CoordinateLabel index={1} label="Exploration" />);
    const label = screen.getByText("§01 · Exploration");
    expect(label).toBeInTheDocument();
    expect(label.className).toMatch(/ui-type-mono/);
  });
});

describe("ExpeditionCard", () => {
  it("reads as Cultiv: cream, dotted border, Playfair logbook typography", () => {
    render(<ExpeditionCard>Card</ExpeditionCard>);
    const card = screen.getByRole("button", { name: "Card" });
    expect(card.className).toMatch(/border-dotted-cartography/);
    expect(card.className).toMatch(/shadow-cartography/);
  });

  it("applies terracotta solid border when selected", () => {
    render(<ExpeditionCard selected>Card</ExpeditionCard>);
    const card = screen.getByRole("button", { name: "Card" });
    expect(card.className).toMatch(/border-terracotta/);
    expect(card.className).toMatch(/border-solid/);
    expect(card).toHaveAttribute("aria-pressed", "true");
  });
});

describe("LogbookProse", () => {
  it("applies logbook typography class", () => {
    render(<LogbookProse data-testid="logbook">Prose</LogbookProse>);
    expect(screen.getByTestId("logbook").className).toMatch(/ui-type-logbook/);
  });
});

describe("Button", () => {
  it("primary variant uses terracotta background and cartography shadow", () => {
    render(<Button>Continue</Button>);
    const button = screen.getByRole("button", { name: "Continue" });
    expect(button.className).toMatch(/bg-terracotta/);
    expect(button.className).toMatch(/shadow-cartography/);
  });
});

describe("Text", () => {
  it("logbook variant uses ui-type-logbook", () => {
    render(<Text variant="logbook">Entry</Text>);
    expect(screen.getByText("Entry").className).toMatch(/ui-type-logbook/);
  });
});

describe("Input", () => {
  it("applies dotted cartography border", () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole("textbox", { name: "Name" }).className).toMatch(
      /border-dotted-cartography/
    );
  });
});

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
