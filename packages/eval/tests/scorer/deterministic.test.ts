import { describe, expect, it } from "vitest";
import { scoreDeterministic } from "../../src/scorer/deterministic.js";
import type { EvalExpectations } from "../../src/types.js";

describe("scoreDeterministic", () => {
  it("returns 100 when no expectations are defined", () => {
    const result = scoreDeterministic("any text", {});

    expect(result.score).toBe(100);
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]?.name).toBe("no-expectations");
  });

  it("returns 0 when text is empty and expectations exist", () => {
    const result = scoreDeterministic("", { mustContain: ["hello"] });

    expect(result.score).toBe(0);
    expect(result.checks[0]?.name).toBe("empty-text");
  });

  it("passes mustContain checks case-insensitively", () => {
    const expectations: EvalExpectations = {
      mustContain: ["monorepo", "AI"]
    };

    const result = scoreDeterministic("Monorepos help AI projects scale.", expectations);

    expect(result.score).toBe(100);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("fails when a mustContain phrase is missing", () => {
    const expectations: EvalExpectations = {
      mustContain: ["monorepo", "quantum"]
    };

    const result = scoreDeterministic("Monorepos help AI projects scale.", expectations);

    expect(result.score).toBe(50);
    expect(result.checks.some((check) => !check.passed)).toBe(true);
  });

  it("passes mustNotContain checks case-insensitively", () => {
    const expectations: EvalExpectations = {
      mustNotContain: ["I think", "In conclusion"]
    };

    const result = scoreDeterministic("A clean argument stands on its own.", expectations);

    expect(result.score).toBe(100);
  });

  it("fails when a mustNotContain phrase is present", () => {
    const expectations: EvalExpectations = {
      mustNotContain: ["I think"]
    };

    const result = scoreDeterministic("I think this is correct.", expectations);

    expect(result.score).toBe(0);
  });

  it("passes when word count is inside the requested range", () => {
    const expectations: EvalExpectations = {
      wordCountRange: { min: 5, max: 10 }
    };

    const result = scoreDeterministic("This sentence has exactly seven words.", expectations);

    expect(result.score).toBe(100);
  });

  it("fails when word count is outside the requested range", () => {
    const expectations: EvalExpectations = {
      wordCountRange: { min: 2, max: 4 }
    };

    const result = scoreDeterministic("This sentence has way too many words.", expectations);

    expect(result.score).toBe(0);
  });

  it("detects formal tone from markers", () => {
    const expectations: EvalExpectations = {
      tone: "formal"
    };

    const result = scoreDeterministic(
      "The evidence is clear; consequently, the committee recommended the change.",
      expectations
    );

    expect(result.score).toBe(100);
  });

  it("detects informal tone from markers", () => {
    const expectations: EvalExpectations = {
      tone: "informal"
    };

    const result = scoreDeterministic(
      "Hey, btw, I kinda wanna share a quick take.",
      expectations
    );

    expect(result.score).toBe(100);
  });

  it("classifies neutral when no strong tone signals are present", () => {
    const expectations: EvalExpectations = {
      tone: "neutral"
    };

    const result = scoreDeterministic(
      "The project is moving forward as planned.",
      expectations
    );

    expect(result.score).toBe(100);
  });

  it("combines multiple checks into a weighted average", () => {
    const expectations: EvalExpectations = {
      mustContain: ["monorepo"],
      mustNotContain: ["I think"],
      wordCountRange: { min: 1, max: 100 }
    };

    const result = scoreDeterministic("I think monorepos are useful.", expectations);

    expect(result.score).toBe(67);
    expect(result.checks).toHaveLength(3);
  });
});
