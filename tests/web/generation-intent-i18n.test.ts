import { describe, expect, it } from "vitest";
import {
  GENERATION_CHANNEL_IDS,
  GENERATION_INTENT_IDS,
  GENERATION_LENGTH_TIER_IDS,
  getChannelDescription,
  getChannelLabel,
  getIntentDescription,
  getIntentLabel,
  getLengthTierDescription,
  getLengthTierLabel
} from "../../apps/web/src/i18n/app/generation-intents.js";
import { getIntentBriefingGuidance } from "../../apps/web/src/i18n/app/intent-briefing.js";

describe("generation intent i18n", () => {
  it("defines pt/en labels and descriptions for every intent id", () => {
    for (const id of GENERATION_INTENT_IDS) {
      for (const locale of ["pt", "en"] as const) {
        const label = getIntentLabel(locale, id, "");
        const description = getIntentDescription(locale, id);

        expect(label.length).toBeGreaterThan(0);
        expect(description?.length ?? 0).toBeGreaterThan(10);
      }
    }
  });

  it("defines pt/en labels and descriptions for every length tier", () => {
    for (const id of GENERATION_LENGTH_TIER_IDS) {
      for (const locale of ["pt", "en"] as const) {
        const label = getLengthTierLabel(locale, id, "");
        const description = getLengthTierDescription(locale, id);

        expect(label.length).toBeGreaterThan(0);
        expect(description?.length ?? 0).toBeGreaterThan(10);
      }
    }
  });

  it("defines pt/en labels and descriptions for every channel", () => {
    for (const id of GENERATION_CHANNEL_IDS) {
      for (const locale of ["pt", "en"] as const) {
        const label = getChannelLabel(locale, id, "");
        const description = getChannelDescription(locale, id);

        expect(label.length).toBeGreaterThan(0);
        expect(description?.length ?? 0).toBeGreaterThan(10);
      }
    }
  });

  it("localizes briefing guidance per intent in Portuguese", () => {
    const guidance = getIntentBriefingGuidance("pt", "engage-audience", {
      objective: "Generate a post that sparks reaction, discussion, or engagement.",
      tips: ["State the hypothesis clearly."],
      exampleBriefing: "Example",
      commonMistakes: ["Sounding like a generic announcement instead of an invitation to react."]
    });

    expect(guidance.objective).toContain("engajamento");
    expect(guidance.tips[0]).not.toContain("State the hypothesis");
    expect(guidance.commonMistakes[0]).not.toContain("generic announcement");
  });

  it("localizes briefing guidance for every intent in pt and en", () => {
    const fallback = {
      objective: "Fallback objective",
      tips: ["Fallback tip"],
      exampleBriefing: "Fallback example",
      commonMistakes: ["Fallback mistake"]
    };

    for (const id of GENERATION_INTENT_IDS) {
      for (const locale of ["pt", "en"] as const) {
        const guidance = getIntentBriefingGuidance(locale, id, fallback);
        expect(guidance.objective.length).toBeGreaterThan(0);
        expect(guidance.tips.length).toBeGreaterThan(0);
        expect(guidance.commonMistakes.length).toBeGreaterThan(0);
      }
    }
  });
});
