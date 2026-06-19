import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  listExpressionInstructionProfiles,
  resolveExpressionFormatInstructions
} from "../../apps/backend/src/product/generation/compositor/expression-instructions.js";
import { resolveStructuredStepTemplate } from "../../apps/backend/src/execution/skill-templates.js";
import { resolveTemplate } from "@my-ai-orchestrator/skills";

describe("compositor expression instructions", () => {
  it("maps email-share-idea to subject line and CTA guidance", () => {
    const instructions = resolveExpressionFormatInstructions("email-share-idea", "draft", {
      min: 400,
      max: 1200
    });

    expect(instructions).toContain("subject line");
    expect(instructions).toContain("CTA");
    expect(instructions).toContain("Target length: between 400 and 1200 words.");
  });

  it("covers channel and intent expression profiles", () => {
    const profiles = listExpressionInstructionProfiles();

    expect(profiles).toContain("email-share-idea");
    expect(profiles).toContain("professional-share-idea");
    expect(profiles).toContain("blog-explain-deeply");
    expect(profiles).toContain("share-idea-default");
  });

  it("includes email subject instruction in draft skill template locals", async () => {
    const structured = resolveStructuredStepTemplate("draft");
    const rendered = await Effect.runPromise(
      resolveTemplate(structured.system, {
      state: {},
      inputs: {
        expressionProfile: "email-share-idea",
        wordTarget: { min: 400, max: 1200 }
      },
      config: {},
      memory: {},
      locals: {
        formatInstructions: resolveExpressionFormatInstructions("email-share-idea", "draft", {
          min: 400,
          max: 1200
        }),
        outputRules: "Return only the final text.",
        tone: "direct",
        cadence: "natural",
        languageCode: "pt-BR",
        languageName: "Portuguese (Brazil)",
        voiceDescription: "-",
        styleMarkers: "-",
        voiceRules: "-",
        voiceConstraints: "-",
        antiPatterns: "-",
        lexiconInstruction: "-",
        lexicon: "-",
        voiceExamples: "-",
        authorReasoningSection: "",
        authorDevelopmentSection: "",
        generationDomain: "briefing-based",
        domainPolicy: "Match the briefing.",
        retryInstruction: "",
        constraints: "",
        previousScore: 0,
        stepLabel: "Draft",
        topic: "Composable pricing",
        briefingText: "Why compositor planning matters",
        sourceText: "",
        previousContent: ""
      }
    })
    );

    expect(rendered).toContain("subject line");
  });
});
