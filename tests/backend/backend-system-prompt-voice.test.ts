import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { resolveStructuredStepTemplate } from "../../apps/backend/src/execution/skill-templates.js";
import { resolveTemplate } from "@my-ai-orchestrator/skills";

describe("system prompt voice injection", () => {
  it("includes imperative voice instructions when voice profile is present", async () => {
    const template = resolveStructuredStepTemplate("draft");
    const systemPrompt = await Effect.runPromise(
      resolveTemplate(template.system, {
        state: {},
        inputs: {},
        config: {},
        memory: undefined,
        locals: {
          tone: "informal",
          cadence: "direct",
          languageName: "Portuguese (Brazil)",
          languageCode: "pt-BR",
          styleMarkers: "- first-person\n- direct-address",
          voiceDescription: "Tom pessoal, direto, com observações concretas.",
          voiceRules: "- prefer_first_person_when_relevant\n- prefer_conservative_voice_adaptation",
          voiceConstraints: "- preserve user voice",
          antiPatterns: "- linguagem comercial\n- autoajuda técnica\n- hype de IA",
          lexicon: "- versao\n- perfis\n- usuario",
          voiceExamples: "Example 1:\nEu sempre começo assim.\n\n---\n\nExample 2:\nVocê já notou isso?",
          authorReasoning: "",
          authorReasoningSection: "",
          authorDevelopmentSection: "",
          argumentLensesSection: "",
          formatInstructions: "Write as a LinkedIn post.",
          outputRules: "Do not echo headers.",
          retryInstruction: "Draft the content.",
          adapter: "test",
          model: "test",
          qualityMode: "strict",
          stepName: "draft",
          stepLabel: "Draft",
          stepIndex: 1,
          totalSteps: 3,
          pipelineName: "linkedin-post",
          topic: "Test topic",
          briefingText: "Briefing text",
          previousContent: "",
          sourceText: "Briefing text",
          constraints: "",
          previousScore: 0,
          lexiconInstruction: "Author lexicon (use sparingly):",
          audienceModulation: "Match terminology to the briefing topic.",
          genreSection: "",
          quantitativeConstraintsSection: ""
        }
      })
    );

    expect(systemPrompt).toContain("Tone: informal");
    expect(systemPrompt).toContain("Cadence: direct");
    expect(systemPrompt).toContain("first-person");
    expect(systemPrompt).toContain("direct-address");
    expect(systemPrompt).toContain("prefer_first_person_when_relevant");
    expect(systemPrompt).toContain("linguagem comercial");
    expect(systemPrompt).toContain("autoajuda técnica");
    expect(systemPrompt).toContain("hype de IA");
    expect(systemPrompt).toContain("versao");
    expect(systemPrompt).toContain("perfis");
    expect(systemPrompt).toContain("usuario");
    expect(systemPrompt).toContain("Example 1:\nEu sempre começo assim.");
    expect(systemPrompt).toContain("Example 2:\nVocê já notou isso?");
    expect(systemPrompt).toContain("Tom pessoal, direto, com observações concretas.");
    expect(systemPrompt).toContain("preserve user voice");
    // F4-5: the tech-first domain policy is gone; the audience-modulation section now occupies that slot.
    expect(systemPrompt).toContain("Match terminology to the briefing topic.");
    expect(systemPrompt).toContain("must feel personal, specific, and unmistakably written by the author");
  });

  it("passes the user's tone instead of the language profile default", async () => {
    const template = resolveStructuredStepTemplate("draft");
    const systemPrompt = await Effect.runPromise(
      resolveTemplate(template.system, {
        state: {},
        inputs: {},
        config: {},
        memory: undefined,
        locals: {
          tone: "informal",
          cadence: "direct",
          languageName: "Portuguese (Brazil)",
          languageCode: "pt-BR",
          voiceDescription: "- (not specified)",
          styleMarkers: "- (none specified)",
          voiceRules: "- (none specified)",
          voiceConstraints: "- (none specified)",
          antiPatterns: "- (none specified)",
          lexicon: "- (none specified)",
          voiceExamples: "- (no examples provided, match tone, cadence, rules, and style markers above)",
          authorReasoning: "",
          authorReasoningSection: "",
          authorDevelopmentSection: "",
          argumentLensesSection: "",
          formatInstructions: "Write as a LinkedIn post.",
          outputRules: "Do not echo headers.",
          retryInstruction: "Draft the content.",
          adapter: "test",
          model: "test",
          qualityMode: "strict",
          stepName: "draft",
          stepLabel: "Draft",
          stepIndex: 1,
          totalSteps: 3,
          pipelineName: "linkedin-post",
          topic: "Test topic",
          briefingText: "Briefing text",
          previousContent: "",
          sourceText: "Briefing text",
          constraints: "",
          previousScore: 0,
          lexiconInstruction: "Author lexicon (use sparingly):",
          audienceModulation: "Match terminology to the briefing topic.",
          genreSection: "",
          quantitativeConstraintsSection: ""
        }
      })
    );

    expect(systemPrompt).toContain("Tone: informal");
    expect(systemPrompt).not.toContain("Tone: professional");
  });
});
