import { describe, expect, it } from "vitest";
import {
  buildAudienceModulationSection,
  resolveLexiconInstruction
} from "../src/execution/pipeline/audience-modulation.js";

describe("buildAudienceModulationSection (F4-4)", () => {
  it("renders jargon, presupposition, ramp, and closing levers when audience is present", () => {
    const section = buildAudienceModulationSection("early-career nurses");

    expect(section).toContain("Writing for: early-career nurses.");
    expect(section).toMatch(/Jargon:.*early-career nurses/);
    expect(section).toMatch(/Presupposition:.*early-career nurses/);
    expect(section).toMatch(/Ramp:/);
    expect(section).toMatch(/Closing:.*early-career nurses/);
  });

  it("states the accessibility-only scope so it never reads as a voice override", () => {
    const section = buildAudienceModulationSection("CFOs at seed-stage startups");
    expect(section).toContain("not how the author sounds");
  });

  it("degrades to a neutral topic-matching instruction when audience is absent, never a tech gate", () => {
    const section = buildAudienceModulationSection(undefined);
    expect(section).toBe("Match terminology to the briefing topic.");
    expect(section).not.toMatch(/technical|jargon|domain/i);
  });
});

describe("resolveLexiconInstruction (F4-4)", () => {
  it("modulates lexicon density by the given audience", () => {
    const instruction = resolveLexiconInstruction("climate policy analysts");
    expect(instruction).toContain("climate policy analysts");
    expect(instruction).toMatch(/use them freely|translate or explain/);
  });

  it("falls back to the neutral author-lexicon instruction when audience is absent", () => {
    const instruction = resolveLexiconInstruction(undefined);
    expect(instruction).toBe(
      "Author lexicon (distinctive words from the author; use sparingly, never repeat a term more than once unless essential):"
    );
  });
});
