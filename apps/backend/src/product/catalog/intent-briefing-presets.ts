import type { BriefingGuidanceView, ContentTypeFieldView } from "@my-ai-orchestrator/contracts";
import type { GenerationIntent } from "@my-ai-orchestrator/contracts";
import { CONTENT_TYPE_PRESETS } from "./content-type-presets.js";

export interface IntentBriefingPreset {
  readonly inputSchema: readonly ContentTypeFieldView[];
  readonly briefingGuidance: BriefingGuidanceView;
}

function fieldsFromPreset(
  contentTypeId: string,
  keys: readonly string[]
): readonly ContentTypeFieldView[] {
  const preset = CONTENT_TYPE_PRESETS[contentTypeId];
  if (!preset) {
    return [];
  }

  return keys
    .map((key) => preset.inputSchema.find((field) => field.key === key))
    .filter((field): field is ContentTypeFieldView => field !== undefined);
}

const ENGAGE_AUDIENCE_QUESTION_FIELD: ContentTypeFieldView = {
  key: "question",
  label: "Question",
  type: "string",
  required: false,
  highImpact: false,
  helpText: "Pose a question to spark discussion."
};

export const INTENT_BRIEFING_PRESETS: Readonly<Record<GenerationIntent, IntentBriefingPreset>> = {
  "share-idea": {
    inputSchema: fieldsFromPreset("linkedin-post", ["topic", "audience", "angle", "proof"]),
    briefingGuidance: CONTENT_TYPE_PRESETS["linkedin-post"]!.briefingGuidance
  },
  "explain-deeply": {
    inputSchema: fieldsFromPreset("long-form-blog", ["topic", "thesis", "outline", "audience"]),
    briefingGuidance: CONTENT_TYPE_PRESETS["long-form-blog"]!.briefingGuidance
  },
  "engage-audience": {
    inputSchema: [
      ...fieldsFromPreset("validation-post", ["topic", "hypothesis", "evidence"]),
      ENGAGE_AUDIENCE_QUESTION_FIELD
    ],
    briefingGuidance: {
      objective: "Generate a post that sparks reaction, discussion, or engagement.",
      tips: [
        "State the hypothesis clearly.",
        "Include a question when you want readers to respond.",
        "Use evidence that invites debate."
      ],
      exampleBriefing:
        "I want to engage my audience about whether monorepos slow down small teams, with a question at the end.",
      commonMistakes: ["Sounding like a generic announcement instead of an invitation to react."]
    }
  },
  "tell-story": {
    inputSchema: fieldsFromPreset("twitter-thread", ["topic", "hook", "beats"]),
    briefingGuidance: CONTENT_TYPE_PRESETS["twitter-thread"]!.briefingGuidance
  },
  "update-subscribers": {
    inputSchema: fieldsFromPreset("newsletter", ["topic", "audience", "promise", "sections"]),
    briefingGuidance: CONTENT_TYPE_PRESETS["newsletter"]!.briefingGuidance
  },
  "document-decision": {
    inputSchema: fieldsFromPreset("architecture-post", ["systemContext", "tradeoffs", "decision"]),
    briefingGuidance: CONTENT_TYPE_PRESETS["architecture-post"]!.briefingGuidance
  }
};
