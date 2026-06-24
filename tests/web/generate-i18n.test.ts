import { describe, expect, it } from "vitest";
import { MARKETING_CONTENT_TYPE_IDS } from "../../apps/web/src/marketing/content/content-types/catalog.js";
import { resolveIntentBriefingFieldLabelKey } from "../../apps/web/src/app/generation/lib/intent-field-label-key.js";
import { getBriefingGuidance } from "../../apps/web/src/i18n/app/briefing-guidance.js";
import { getFieldHelpText, getFieldLabel, hasFieldCopy } from "../../apps/web/src/i18n/app/field-labels.js";
import { getGenerationLanguageLabel } from "../../apps/web/src/i18n/app/generation-languages.js";
import { getPreviewRecommendationExplanation } from "../../apps/web/src/i18n/app/preview-recommendation.js";

const fieldsByContentType = {
  "long-form-blog": ["topic", "thesis", "outline", "audience"],
  "validation-post": ["topic", "hypothesis", "evidence", "question"],
  "architecture-post": ["systemContext", "tradeoffs", "decision"],
  "linkedin-post": ["topic", "audience", "angle", "proof"],
  "twitter-thread": ["topic", "hook", "beats"],
  newsletter: ["topic", "audience", "promise", "sections"]
} as const;

describe("generate screen i18n overlays", () => {
  it("localizes briefing field labels and help text for every catalog format", () => {
    for (const contentTypeId of MARKETING_CONTENT_TYPE_IDS) {
      for (const fieldKey of fieldsByContentType[contentTypeId]) {
        expect(hasFieldCopy(contentTypeId, fieldKey)).toBe(true);

        const label = getFieldLabel("pt", contentTypeId, fieldKey, fieldKey);
        const helpText = getFieldHelpText("pt", contentTypeId, fieldKey, `Help for ${fieldKey}`);

        expect(label).not.toBe(fieldKey);
        expect(helpText).toBeDefined();
        expect(helpText).not.toMatch(/^Help for /);
      }
    }
  });

  it("localizes briefing guidance in Portuguese", () => {
    const guidance = getBriefingGuidance("pt", "linkedin-post", {
      objective: "Generate a concise LinkedIn post with a clear opinion.",
      tips: ["Use one concrete idea."],
      exampleBriefing: "Example",
      commonMistakes: ["Being too broad."]
    });

    expect(guidance.objective).toContain("publicação");
    expect(guidance.tips[0]).not.toContain("Use one concrete");
    expect(guidance.commonMistakes[0]).not.toContain("Being too broad");
  });

  it("localizes generation language options", () => {
    expect(getGenerationLanguageLabel("pt", "pt-BR")).toBe("Português (Brasil)");
    expect(getGenerationLanguageLabel("pt", "en-US")).toBe("Inglês (EUA)");
  });

  it("localizes engage-audience briefing fields via validation-post labels regardless of length tier", () => {
    const fieldLabelKey = resolveIntentBriefingFieldLabelKey("engage-audience");

    expect(fieldLabelKey).toBe("validation-post");
    expect(getFieldLabel("pt", fieldLabelKey, "hypothesis", "Hypothesis")).toBe("Hipótese");
    expect(getFieldLabel("pt", fieldLabelKey, "evidence", "Evidence")).toBe("Pontos de prova");
    expect(getFieldLabel("pt", fieldLabelKey, "question", "Question")).toBe("Pergunta");
  });

  it("localizes preview recommendation explanations", () => {
    const explanation = getPreviewRecommendationExplanation(
      "pt",
      {
        qualityMode: "balanced",
        reasonCodes: ["balanced_default"],
        explanation: "Balanced is recommended because this request benefits from structure without needing the highest-cost mode."
      },
      { fast: "Direto", balanced: "Equilibrado", strict: "Afinado" }
    );

    expect(explanation).toContain("Equilibrado");
    expect(explanation).not.toContain("Balanced is recommended");
  });
});
