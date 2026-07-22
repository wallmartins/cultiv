import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { resolveTemplate } from "@my-ai-orchestrator/skills";
import { resolveOutputRules, resolveStructuredStepTemplate } from "../src/execution/skill-templates.js";
import { buildAudienceModulationSection, resolveLexiconInstruction } from "../src/execution/pipeline/audience-modulation.js";
import { buildGenreSection } from "../src/execution/pipeline/genre-section.js";

describe("resolveOutputRules — F4-5 tech-first residue cleanup", () => {
  it("no longer gates jargon behind a technical generation domain", () => {
    for (const step of ["draft", "hook", "outline", "tighten", "refine"]) {
      expect(resolveOutputRules(step)).not.toMatch(/generation domain is technical/i);
    }
  });

  it("replaces it with a positive, audience-driven jargon instruction", () => {
    expect(resolveOutputRules("draft")).toMatch(/Calibrate jargon.*audience/i);
  });
});

describe("buildSystemTemplate — F4-4/F4-5 section wiring", () => {
  it("exposes the audience-modulation and genre placeholders, and drops the domain framing", () => {
    const { system } = resolveStructuredStepTemplate("draft");

    expect(system).toContain("{{audienceModulation}}");
    expect(system).toContain("{{genreSection}}");
    expect(system).not.toContain("{{domainPolicy}}");
    expect(system).not.toContain("{{generationDomain}}");
    expect(system).not.toMatch(/Generation domain:/);
    expect(system).not.toMatch(/AND DOMAIN/);
  });

  it("rescopes the topic/audience line to comprehensibility, not style", () => {
    const { system } = resolveStructuredStepTemplate("draft");
    const line = system.split("\n").find((entry) => entry.startsWith("The briefing defines topic and angle"));

    expect(line).toBeDefined();
    expect(line).toMatch(/does not change with audience/);
  });
});

describe("end-to-end prompt render — audience + genre reach the final system prompt", () => {
  const baseLocals = {
    tone: "direct",
    cadence: "clipped",
    languageName: "English",
    languageCode: "en",
    voiceDescription: "- (not specified)",
    styleMarkers: "- (none specified)",
    voiceRules: "- (none specified)",
    voiceConstraints: "- (none specified)",
    antiPatterns: "- (none specified)",
    lexicon: "- (none specified)",
    voiceExamples: "- (no examples provided)",
    authorReasoningSection: "",
    authorDevelopmentSection: "",
    argumentLensesSection: "",
    quantitativeConstraintsSection: "",
    formatInstructions: "Write as final publishable content.",
    outputRules: resolveOutputRules("draft"),
    retryInstruction: ""
  };

  function renderSystemPrompt(locals: Record<string, unknown>): string {
    const { system } = resolveStructuredStepTemplate("draft");
    return Effect.runSync(
      resolveTemplate(system, {
        state: {},
        inputs: {},
        config: {},
        locals: { ...baseLocals, ...locals }
      })
    );
  }

  it("renders the audience levers and no tech-first gate language when an audience is present", () => {
    const audience = "solo indie hackers";
    const prompt = renderSystemPrompt({
      lexiconInstruction: resolveLexiconInstruction(audience),
      audienceModulation: buildAudienceModulationSection(audience),
      genreSection: ""
    });

    expect(prompt).toContain("== TOPIC AND AUDIENCE ==");
    expect(prompt).toContain(`Writing for: ${audience}.`);
    expect(prompt).toMatch(/Jargon:/);
    expect(prompt).toMatch(/Presupposition:/);
    expect(prompt).toMatch(/Ramp:/);
    expect(prompt).toMatch(/Closing:/);
    expect(prompt).not.toMatch(/generation domain is technical/i);
    expect(prompt).not.toMatch(/Generation domain:/);
  });

  it("renders the neutral fallback when no audience is present", () => {
    const prompt = renderSystemPrompt({
      lexiconInstruction: resolveLexiconInstruction(undefined),
      audienceModulation: buildAudienceModulationSection(undefined),
      genreSection: ""
    });

    expect(prompt).toContain("Match terminology to the briefing topic.");
    expect(prompt).not.toMatch(/generation domain is technical/i);
    expect(prompt).not.toMatch(/Generation domain:/);
  });

  it("renders the genre section's secondary mode, posture, and prose when genre is present", () => {
    const prompt = renderSystemPrompt({
      lexiconInstruction: resolveLexiconInstruction(undefined),
      audienceModulation: buildAudienceModulationSection(undefined),
      genreSection: buildGenreSection({
        rhetoricalMode: { dominant: "promote", secondary: "narrate" },
        epistemicPosture: "promotional",
        prose: "promotional via founder story"
      })
    });

    expect(prompt).toContain("== GENRE ==");
    expect(prompt).toContain("Secondary rhetorical mode: narrative");
    expect(prompt).toContain("This piece's epistemic posture: promotional.");
    expect(prompt).toContain("promotional via founder story");
  });

  it("renders nothing for genre when it is absent", () => {
    const prompt = renderSystemPrompt({
      lexiconInstruction: resolveLexiconInstruction(undefined),
      audienceModulation: buildAudienceModulationSection(undefined),
      genreSection: buildGenreSection(undefined)
    });

    expect(prompt).not.toContain("== GENRE ==");
  });
});
