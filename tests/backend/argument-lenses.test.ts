import { describe, expect, it } from "vitest";
import {
  buildArgumentLensesSection,
  formatArgumentLensesPromptBlock,
  isArgumentLensStep,
  resolveMaxLensesFromDensity,
  resolvePerspectiveShiftDensity,
  selectArgumentLenses
} from "../../apps/backend/src/product/generation/argument-lenses.js";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";

describe("argument lenses", () => {
  it("selects intent-default lenses for document-decision", () => {
    expect(
      selectArgumentLenses({
        intent: "document-decision",
        perspectiveShiftDensity: "high"
      })
    ).toEqual(["operational", "organizational", "psychological"]);
  });

  it("selects intent-default lenses for engage-audience", () => {
    expect(
      selectArgumentLenses({
        intent: "engage-audience",
        perspectiveShiftDensity: "moderate"
      })
    ).toEqual(["psychological", "team"]);
  });

  it("selects intent-default lenses for explain-deeply", () => {
    expect(
      selectArgumentLenses({
        intent: "explain-deeply",
        perspectiveShiftDensity: "moderate"
      })
    ).toEqual(["operational", "temporal"]);
  });

  it("adds briefing keyword lenses before fallback order", () => {
    expect(
      selectArgumentLenses({
        intent: "share-idea",
        briefing: "Team collaboration and budget trade-offs for next quarter",
        perspectiveShiftDensity: "high"
      })
    ).toEqual(["financial", "team", "operational"]);
  });

  it("is deterministic for the same input", () => {
    const input = {
      intent: "document-decision",
      briefing: "Leadership culture and long-term timeline",
      perspectiveShiftDensity: "high" as const
    };

    expect(selectArgumentLenses(input)).toEqual(selectArgumentLenses(input));
  });

  it("maps perspectiveShiftDensity to max lens count", () => {
    expect(resolveMaxLensesFromDensity("low")).toBe(1);
    expect(resolveMaxLensesFromDensity("moderate")).toBe(2);
    expect(resolveMaxLensesFromDensity("high")).toBe(3);
  });

  it("limits lenses to maxLenses override", () => {
    expect(
      selectArgumentLenses({
        intent: "explain-deeply",
        maxLenses: 1
      })
    ).toEqual(["operational"]);
  });

  it("formats the argument lenses prompt block", () => {
    const block = formatArgumentLensesPromptBlock(["operational", "team"]);

    expect(block).toContain("== ARGUMENT LENSES ==");
    expect(block).toContain("Develop the same thesis through each lens below");
    expect(block).toContain("Do not change the topic");
    expect(block).toContain("Do not invent statistics");
    expect(block).toContain("- Operational:");
    expect(block).toContain("- Team:");
  });

  it("returns empty prompt block when no lenses are selected", () => {
    expect(formatArgumentLensesPromptBlock([])).toBe("");
  });

  it("resolves perspectiveShiftDensity from trait profile records", () => {
    const profile = {
      argumentDevelopmentSignature: {
        developmentProse: "prose",
        moveLabels: [],
        transitionTendencies: [],
        epistemicPosture: "exploratory",
        structuralAntiPatterns: [],
        traitProfile: {
          traits: {},
          records: {
            perspectiveShiftDensity: {
              value: "high",
              confidence: "high",
              status: "confirmed",
              evidenceExampleIds: []
            }
          }
        }
      }
    } satisfies Partial<VoiceProfile>;

    expect(resolvePerspectiveShiftDensity(profile)).toBe("high");
  });

  it("resolves perspectiveShiftDensity from trait profile traits", () => {
    const profile = {
      argumentDevelopmentSignature: {
        developmentProse: "prose",
        moveLabels: [],
        transitionTendencies: [],
        epistemicPosture: "exploratory",
        structuralAntiPatterns: [],
        traitProfile: {
          traits: { perspectiveShiftDensity: "low" },
          records: {}
        }
      }
    } satisfies Partial<VoiceProfile>;

    expect(resolvePerspectiveShiftDensity(profile)).toBe("low");
  });

  it("includes lenses only on draft, expand, and structure steps", () => {
    expect(isArgumentLensStep("draft")).toBe(true);
    expect(isArgumentLensStep("expand")).toBe(true);
    expect(isArgumentLensStep("structure")).toBe(true);
    expect(isArgumentLensStep("hook")).toBe(false);
    expect(isArgumentLensStep("tighten")).toBe(false);
  });

  it("builds section for draft and omits for hook", () => {
    const voiceProfile = {
      argumentDevelopmentSignature: {
        developmentProse: "prose",
        moveLabels: [],
        transitionTendencies: [],
        epistemicPosture: "exploratory",
        structuralAntiPatterns: [],
        traitProfile: {
          traits: { perspectiveShiftDensity: "moderate" },
          records: {}
        }
      }
    } satisfies Partial<VoiceProfile>;

    const draftSection = buildArgumentLensesSection({
      stepName: "draft",
      voiceProfile,
      intent: "engage-audience",
      briefing: "Briefing"
    });
    const hookSection = buildArgumentLensesSection({
      stepName: "hook",
      voiceProfile,
      intent: "engage-audience",
      briefing: "Briefing"
    });

    expect(draftSection).toContain("== ARGUMENT LENSES ==");
    expect(hookSection).toBe("");
  });
});
