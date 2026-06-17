import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { resolveStructuredStepTemplate } from "../../apps/backend/src/execution/skill-templates.js";
import { formatAuthorReasoningBlock, formatAuthorReasoningSection } from "../../apps/backend/src/execution/pipeline/reasoning-prompt.js";
import {
  formatArgumentDevelopmentBlock,
  formatArgumentDevelopmentSection,
  formatDevelopmentTraitSummaryLine
} from "../../apps/backend/src/execution/pipeline/development-prompt.js";
import { resolveTemplate } from "@my-ai-orchestrator/skills";
import { COGNITIVE_PRESET_RULE_MARKERS } from "../../apps/backend/src/product/voice/voice-presets.js";
import type {
  ArgumentDevelopmentSignature,
  CoreReasoningSignature,
  FormatExpressionProfile
} from "@my-ai-orchestrator/contracts";

const core: CoreReasoningSignature = {
  narrativeProse:
    "The author observes concrete situations, tolerates ambiguity, and delays judgment until the context is clear.",
  certaintyLevel: "moderate",
  judgmentFrequency: "low",
  conclusionPace: "slow",
  readerRelationship: "peer",
  authoritySource: "personal_observation",
  derivedAntiPatterns: ["generic linkedin tone", "numbered thesis proof list"]
};

const formatExpression: FormatExpressionProfile = {
  contentType: "linkedin-post",
  narrativeProse: "LinkedIn posts stay conversational with short paragraphs.",
  register: "conversational",
  openingStyle: "direct",
  technicalDensity: "low"
};

const development: ArgumentDevelopmentSignature = {
  developmentProse:
    "The author opens from lived experience, tolerates doubt, and tests ideas before landing on a conclusion.",
  moveLabels: ["lived_experience", "doubt", "experimentation"],
  transitionTendencies: [{ from: "lived_experience", to: "doubt", frequency: "common" }],
  epistemicPosture: "exploratory",
  structuralAntiPatterns: ["premature_thesis"]
};

const templateLocals = {
  tone: "informal",
  cadence: "direct",
  languageName: "Portuguese (Brazil)",
  languageCode: "pt-BR",
  styleMarkers: "- first-person",
  voiceDescription: "Tom pessoal.",
  voiceRules: "- prefer_first_person",
  voiceConstraints: "- preserve user voice",
  antiPatterns: "- generic linkedin tone",
  lexicon: "- contexto",
  voiceExamples: "Example 1:\nEu começo observando.",
  formatInstructions: "LinkedIn post.",
  outputRules: "Return only final text.",
  retryInstruction: "Draft.",
  adapter: "test",
  model: "test",
  qualityMode: "strict",
  stepIndex: 1,
  totalSteps: 3,
  pipelineName: "linkedin-post",
  topic: "Topic",
  briefingText: "Briefing",
  previousContent: "",
  sourceText: "Briefing",
  constraints: "",
  previousScore: 0,
  lexiconInstruction: "Author lexicon:",
  domainPolicy: "Match topic.",
  generationDomain: "non-technical",
  stepLabel: "Step"
};

async function renderSystemPrompt(stepName: string, reasoningEnabled: boolean, developmentEnabled = false) {
  const template = resolveStructuredStepTemplate(stepName);
  return Effect.runPromise(
    resolveTemplate(template.system, {
      state: {},
      inputs: {},
      config: {},
      memory: undefined,
      locals: {
        ...templateLocals,
        stepName,
        authorReasoning: reasoningEnabled
          ? formatAuthorReasoningBlock(stepName, core, formatExpression)
          : "",
        authorReasoningSection: reasoningEnabled
          ? formatAuthorReasoningSection(stepName, core, formatExpression)
          : "",
        authorDevelopment: developmentEnabled
          ? formatArgumentDevelopmentBlock(stepName, development)
          : "",
        authorDevelopmentSection: developmentEnabled
          ? formatArgumentDevelopmentSection(stepName, development)
          : ""
      }
    })
  );
}

describe("reasoning prompt snapshots", () => {
  it("omits the reasoning section when flag is off", async () => {
    const prompt = await renderSystemPrompt("draft", false);
    expect(prompt).not.toContain("== AUTHOR REASONING ==");
    expect(prompt).not.toContain(core.narrativeProse);
  });

  it("includes full reasoning on LinkedIn hook and draft when flag is on", async () => {
    for (const stepName of ["hook", "draft"] as const) {
      const prompt = await renderSystemPrompt(stepName, true);
      expect(prompt).toContain("== AUTHOR REASONING ==");
      expect(prompt).toContain(core.narrativeProse);
      expect(prompt).toContain("Format expression:");
      expect(prompt).toContain(formatExpression.narrativeProse);
      expect(prompt).not.toContain("progress through discovery");
    }
  });

  it("shows guardrail enums only on refine", async () => {
    const prompt = await renderSystemPrompt("refine", true);
    expect(prompt).toContain("== AUTHOR REASONING ==");
    expect(prompt).toContain("Reasoning guardrails:");
    expect(prompt).toContain("Certainty level: moderate");
    expect(prompt).not.toContain(core.narrativeProse);
    expect(prompt).toContain("generic linkedin tone");
  });

  it("does not inject preset cognitive strings into the reasoning section", async () => {
    const prompt = await renderSystemPrompt("draft", true);
    const reasoningStart = prompt.indexOf("== AUTHOR REASONING ==");
    const reasoningBlock = prompt.slice(reasoningStart);

    for (const marker of COGNITIVE_PRESET_RULE_MARKERS) {
      expect(reasoningBlock.toLowerCase()).not.toContain(marker);
    }
  });

  it("includes a separate development section on draft when enabled", async () => {
    const prompt = await renderSystemPrompt("draft", true, true);
    expect(prompt).toContain("== AUTHOR REASONING ==");
    expect(prompt).toContain("== ARGUMENT DEVELOPMENT ==");
    expect(prompt).toContain(development.developmentProse);
  });

  it("includes high-confidence trait summary on structural draft steps only", () => {
    const developmentWithTraits: ArgumentDevelopmentSignature = {
      ...development,
      traitProfile: {
        traits: { openingMode: "observation", insightTiming: "late", closingMode: "open_question" },
        records: {
          openingMode: {
            value: "observation",
            confidence: "high",
            status: "inferred",
            evidenceExampleIds: []
          },
          perspectiveShiftDensity: {
            confidence: "low",
            status: "unknown",
            evidenceExampleIds: []
          },
          usesCounterexamples: {
            confidence: "low",
            status: "unknown",
            evidenceExampleIds: []
          },
          selfQuestioning: {
            confidence: "low",
            status: "unknown",
            evidenceExampleIds: []
          },
          insightTiming: {
            value: "late",
            confidence: "high",
            status: "inferred",
            evidenceExampleIds: []
          },
          usesAnalogies: {
            confidence: "low",
            status: "unknown",
            evidenceExampleIds: []
          },
          closingMode: {
            value: "open_question",
            confidence: "medium",
            status: "disputed",
            evidenceExampleIds: []
          }
        }
      }
    };

    const draftBlock = formatArgumentDevelopmentBlock("draft", developmentWithTraits);
    const refineBlock = formatArgumentDevelopmentBlock("refine", developmentWithTraits);

    expect(draftBlock).toContain("Development traits (confirmed):");
    expect(draftBlock).toContain("openingMode=observation");
    expect(draftBlock).not.toContain("closingMode=open_question");
    expect(refineBlock).not.toContain("Development traits (confirmed):");
    expect(formatDevelopmentTraitSummaryLine(developmentWithTraits.traitProfile)).toContain("insightTiming=late");
  });
});
