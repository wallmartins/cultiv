import type { BriefingGuidanceView, ContentTypeFieldView } from "@my-ai-orchestrator/contracts";

export interface ContentTypePreset {
  readonly supportedLanguages: readonly string[];
  readonly inputSchema: readonly ContentTypeFieldView[];
  readonly briefingGuidance: BriefingGuidanceView;
}

export const CONTENT_TYPE_PRESETS: Readonly<Record<string, ContentTypePreset>> = {
  "linkedin-post": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the main idea of the post."
      },
      {
        key: "audience",
        label: "Audience",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Specify who should care about the post."
      },
      {
        key: "angle",
        label: "Angle",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "State the opinion or framing you want."
      },
      {
        key: "proof",
        label: "Proof points",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List concrete examples or evidence."
      }
    ],
    briefingGuidance: {
      objective: "Generate a concise LinkedIn post with a clear opinion.",
      tips: ["Use one concrete idea.", "Open with a direct hook.", "Keep the brief focused."],
      exampleBriefing: "I want a LinkedIn post about trade-offs in monorepos for senior engineers.",
      commonMistakes: ["Being too broad.", "Leaving the audience undefined."]
    }
  },
  newsletter: {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the main theme of the newsletter."
      },
      {
        key: "audience",
        label: "Audience",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Specify the reader segment."
      },
      {
        key: "promise",
        label: "Core promise",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "State the value the reader gets."
      },
      {
        key: "sections",
        label: "Sections",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the sections or beats to include."
      }
    ],
    briefingGuidance: {
      objective: "Generate a newsletter brief with structure and payoff.",
      tips: ["Define the audience.", "Include the takeaway upfront.", "Suggest a section flow."],
      exampleBriefing: "I want a newsletter about shipping process improvements for product teams.",
      commonMistakes: ["Overloading the brief with unrelated topics."]
    }
  },
  "validation-post": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the issue being validated."
      },
      {
        key: "hypothesis",
        label: "Hypothesis",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "State what you want to prove or disprove."
      },
      {
        key: "evidence",
        label: "Evidence",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the supporting facts or examples."
      }
    ],
    briefingGuidance: {
      objective: "Generate a short post that validates an idea with evidence.",
      tips: ["State the hypothesis clearly.", "Use examples that can be checked.", "Keep the brief direct."],
      exampleBriefing: "I want to validate a post about using a single domain model across services.",
      commonMistakes: ["Making the post sound like a generic announcement."]
    }
  },
  "architecture-post": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "systemContext",
        label: "System context",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the architecture or system boundaries."
      },
      {
        key: "tradeoffs",
        label: "Trade-offs",
        type: "array",
        required: true,
        highImpact: true,
        helpText: "List the main design trade-offs."
      },
      {
        key: "decision",
        label: "Decision",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "State the recommendation or conclusion."
      }
    ],
    briefingGuidance: {
      objective: "Generate a post that explains a technical architecture decision.",
      tips: ["Give enough context to understand the system.", "Highlight the constraints.", "Make the trade-offs explicit."],
      exampleBriefing: "I want a post about why we split execution and voice services in the backend.",
      commonMistakes: ["Focusing on implementation details before the design choice."]
    }
  },
  "long-form-blog": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the article subject."
      },
      {
        key: "thesis",
        label: "Thesis",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "State the main argument."
      },
      {
        key: "outline",
        label: "Outline",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the article sections."
      },
      {
        key: "audience",
        label: "Audience",
        type: "string",
        required: false,
        highImpact: false,
        helpText: "Specify who the article is for."
      }
    ],
    briefingGuidance: {
      objective: "Generate a long-form blog brief with thesis and structure.",
      tips: ["Define the thesis early.", "Keep the outline actionable.", "Add the audience and desired depth."],
      exampleBriefing: "I want a long-form blog post explaining how to migrate a backend to Hono and Effect.",
      commonMistakes: ["Creating a vague outline with no opinion."]
    }
  },
  "twitter-thread": {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Describe the thread subject."
      },
      {
        key: "hook",
        label: "Hook",
        type: "string",
        required: true,
        highImpact: true,
        helpText: "Write the opening hook."
      },
      {
        key: "beats",
        label: "Beats",
        type: "array",
        required: false,
        highImpact: false,
        helpText: "List the key thread beats."
      }
    ],
    briefingGuidance: {
      objective: "Generate a short thread with a strong hook and tight flow.",
      tips: ["Lead with tension.", "Keep each beat focused.", "End with a clear conclusion."],
      exampleBriefing: "I want a thread about the trade-offs of composition over inheritance in product code.",
      commonMistakes: ["Trying to fit too many ideas into one thread."]
    }
  }
};
