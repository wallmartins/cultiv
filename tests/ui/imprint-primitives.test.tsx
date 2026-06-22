/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PressMark } from "../../packages/ui/src/primitives/PressMark.js";

describe("PressMark", () => {
  it("renders accessible logo mark", () => {
    render(<PressMark />);
    expect(screen.getByRole("img", { name: /cultiv/i })).toBeInTheDocument();
  });
});
