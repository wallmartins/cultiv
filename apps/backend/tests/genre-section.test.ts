import { describe, expect, it } from "vitest";
import type { GenreSignature } from "@my-ai-orchestrator/contracts";
import { buildGenreSection } from "../src/execution/pipeline/genre-section.js";

const BASE_GENRE: GenreSignature = {
  rhetoricalMode: { dominant: "argue" },
  epistemicPosture: "investigative",
  prose: "argumentative via competitive comparison"
};

describe("buildGenreSection (F4-7 prompt side)", () => {
  it("renders nothing when genre is absent", () => {
    expect(buildGenreSection(undefined)).toBe("");
  });

  it("carries secondary mode, epistemic posture, and prose without repeating the dominant mode", () => {
    const genre: GenreSignature = {
      ...BASE_GENRE,
      rhetoricalMode: { dominant: "argue", secondary: "promote" }
    };
    const section = buildGenreSection(genre);

    expect(section).toContain("== GENRE ==");
    expect(section).toContain("Secondary rhetorical mode: promotional");
    expect(section).toContain("This piece's epistemic posture: investigative.");
    expect(section).toContain("argumentative via competitive comparison");
    expect(section).not.toContain("Dominant rhetorical mode:");
  });

  it("omits the secondary-mode line when there is no secondary mode", () => {
    const section = buildGenreSection(BASE_GENRE);
    expect(section).not.toContain("Secondary rhetorical mode");
    expect(section).toContain("This piece's epistemic posture: investigative.");
  });

  it("omits the posture line for not_applicable rather than leaking the raw enum token", () => {
    const section = buildGenreSection({
      rhetoricalMode: { dominant: "narrate" },
      epistemicPosture: "not_applicable",
      prose: "a personal essay"
    });

    expect(section).not.toContain("not_applicable");
    expect(section).not.toContain("epistemic posture");
    expect(section).toContain("a personal essay");
  });

  it("omits the prose line when prose is empty (the generation-side degrade default)", () => {
    const section = buildGenreSection({
      rhetoricalMode: { dominant: "expound" },
      epistemicPosture: "expository",
      prose: ""
    });

    expect(section).toContain("This piece's epistemic posture: expository.");
    expect(section.trim().split("\n")).toHaveLength(2);
  });
});
