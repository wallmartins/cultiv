import { describe, expect, it } from "vitest";
import { localizeIntentCatalogItem } from "../../apps/web/src/app/generation/lib/use-generation-intents.js";

describe("useGenerationIntents helpers", () => {
  it("merges catalog labels with localized intent copy", () => {
    const localized = localizeIntentCatalogItem("pt", {
      id: "share-idea",
      label: "Share an idea",
      description: "Opinion, lesson, or takeaway for an audience.",
      defaultLengthTier: "short",
      featured: true,
      inputSchema: [{ key: "topic", label: "Topic", required: true, type: "text" }],
      briefingGuidance: {
        objective: "Share an idea",
        tips: [],
        exampleBriefing: "Example",
        commonMistakes: []
      }
    });

    expect(localized.label).toBe("Compartilhar descoberta");
    expect(localized.description).toContain("descoberta");
    expect(localized.inputSchema[0]?.key).toBe("topic");
  });
});
