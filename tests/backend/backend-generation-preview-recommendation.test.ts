import { describe, expect, it } from "vitest";
import type { ContentTypeCatalogItemView, QualityMode } from "@my-ai-orchestrator/contracts";
import { recommendGenerationPreviewQualityMode } from "../../apps/backend/src/product/generation/generation-preview-recommendation.js";

const architectureContentType: ContentTypeCatalogItemView = {
  id: "architecture-post",
  label: "Architecture Post",
  available: true,
  defaultLanguage: "pt-BR",
  supportedLanguages: ["pt-BR", "en-US"],
  steps: ["analyze", "outline", "draft", "refine"],
  inputSchema: [
    {
      key: "systemContext",
      label: "System context",
      type: "string",
      required: true,
      highImpact: true
    },
    {
      key: "tradeoffs",
      label: "Trade-offs",
      type: "array",
      required: true,
      highImpact: true
    },
    {
      key: "decision",
      label: "Decision",
      type: "string",
      required: false,
      highImpact: false
    }
  ],
  briefingGuidance: {
    objective: "Explain the architecture decision.",
    tips: ["Highlight constraints."],
    exampleBriefing: "Explain the backend split.",
    commonMistakes: ["Skipping trade-offs."]
  }
};

const linkedinContentType: ContentTypeCatalogItemView = {
  id: "linkedin-post",
  label: "LinkedIn Post",
  available: true,
  defaultLanguage: "pt-BR",
  supportedLanguages: ["pt-BR", "en-US"],
  steps: ["draft", "polish"],
  inputSchema: [
    {
      key: "topic",
      label: "Topic",
      type: "string",
      required: true,
      highImpact: true
    },
    {
      key: "audience",
      label: "Audience",
      type: "string",
      required: true,
      highImpact: true
    }
  ],
  briefingGuidance: {
    objective: "Create a direct short post.",
    tips: ["Keep one idea."],
    exampleBriefing: "A short post about monorepos.",
    commonMistakes: ["Too many ideas."]
  }
};

describe("generation preview recommendation", () => {
  it("recommends strict for a complex request with voice context", () => {
    const recommendation = recommendGenerationPreviewQualityMode({
      contentType: architectureContentType,
      briefing: {
        systemContext: "We split orchestration from execution to keep product policy isolated from runtime concerns.",
        tradeoffs: ["simpler modules", "clear ownership", "extra integration boundary"],
        decision: "Keep immutable snapshots crossing the boundary."
      },
      hasVoiceProfile: true,
      qualityModes: createQualityModes(["fast", "balanced", "strict"])
    });

    expect(recommendation?.qualityMode).toBe("strict");
    expect(recommendation?.reasonCodes).toEqual(
      expect.arrayContaining(["complex_content_type", "structured_briefing", "voice_profile_available"])
    );
  });

  it("recommends fast for a short low-complexity request", () => {
    const recommendation = recommendGenerationPreviewQualityMode({
      contentType: linkedinContentType,
      briefing: "Post about monorepo trade-offs for CTOs.",
      hasVoiceProfile: false,
      qualityModes: createQualityModes(["fast", "balanced", "strict"])
    });

    expect(recommendation?.qualityMode).toBe("fast");
    expect(recommendation?.reasonCodes).toEqual(["simple_request"]);
  });

  it("falls back to an allowed mode when the preferred one is blocked", () => {
    const recommendation = recommendGenerationPreviewQualityMode({
      contentType: architectureContentType,
      briefing: {
        systemContext: "Preserve contract integrity across preview and execution.",
        tradeoffs: ["complexity", "rollback risk", "policy drift"],
        decision: "Adopt immutable snapshots."
      },
      hasVoiceProfile: true,
      qualityModes: [
        { id: "fast", allowed: true },
        { id: "balanced", allowed: false },
        { id: "strict", allowed: false }
      ]
    });

    expect(recommendation?.qualityMode).toBe("fast");
    expect(recommendation?.reasonCodes).toContain("allowed_option_guard");
    expect(recommendation?.explanation).toContain("currently available options");
  });
});

function createQualityModes(allowedModes: readonly QualityMode[]) {
  return (["fast", "balanced", "strict"] as const).map((id) => ({
    id,
    allowed: allowedModes.includes(id)
  }));
}
