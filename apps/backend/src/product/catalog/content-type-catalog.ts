import type { BriefingGuidanceView, ContentTypeCatalogItemView, ContentTypeFieldView } from "@my-ai-orchestrator/contracts";
import { CONTENT_TYPE_PRESETS, type ContentTypePreset } from "./content-type-presets.js";

export function buildContentTypeCatalogView(
  definitions: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly defaultLanguage: string;
    readonly steps: readonly string[];
    readonly inputSchema: Readonly<Record<string, unknown>>;
  }>,
  context: {
    readonly userLanguage: string;
    readonly subscriptionActive: boolean;
  }
): ReadonlyArray<ContentTypeCatalogItemView> {
  return definitions
    .map((definition) => buildContentTypeCatalogItem(definition, context))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function buildContentTypeCatalogItem(
  definition: {
    readonly id: string;
    readonly label: string;
    readonly defaultLanguage: string;
    readonly steps: readonly string[];
    readonly inputSchema: Readonly<Record<string, unknown>>;
  },
  context: {
    readonly userLanguage: string;
    readonly subscriptionActive: boolean;
  }
): ContentTypeCatalogItemView {
  const preset = CONTENT_TYPE_PRESETS[definition.id] ?? fallbackPreset(definition.id, definition.label);
  const available = context.subscriptionActive;
  const reasonCode = available ? undefined : "subscription_inactive";
  const supportedLanguages = uniqueStrings([definition.defaultLanguage, context.userLanguage, ...preset.supportedLanguages]);
  const briefingGuidanceByLanguage = buildGuidanceByLanguage(preset.briefingGuidance, context.userLanguage);

  return {
    id: definition.id,
    label: definition.label,
    available,
    defaultLanguage: definition.defaultLanguage,
    supportedLanguages,
    steps: [...definition.steps],
    inputSchema: preset.inputSchema,
    briefingGuidance: briefingGuidanceByLanguage[definition.defaultLanguage] ?? preset.briefingGuidance,
    ...(reasonCode ? { reasonCode } : {}),
    ...(Object.keys(briefingGuidanceByLanguage).length > 1 ? { briefingGuidanceByLanguage } : {})
  };
}

function buildGuidanceByLanguage(
  baseGuidance: BriefingGuidanceView,
  userLanguage: string
): Readonly<Record<string, BriefingGuidanceView>> {
  const guidance: Record<string, BriefingGuidanceView> = {
    "pt-BR": baseGuidance,
    "en-US": translateGuidance(baseGuidance)
  };

  if (userLanguage !== "pt-BR" && userLanguage !== "en-US") {
    guidance[userLanguage] = baseGuidance;
  }

  return guidance;
}

function translateGuidance(guidance: BriefingGuidanceView): BriefingGuidanceView {
  return {
    objective: `Generate a brief that leads to: ${guidance.objective}`,
    tips: guidance.tips.map((tip) => `Tip: ${tip}`),
    exampleBriefing: `Example brief: ${guidance.exampleBriefing}`,
    commonMistakes: guidance.commonMistakes.map((mistake) => `Avoid: ${mistake}`)
  };
}

function fallbackPreset(contentTypeId: string, label: string): ContentTypePreset {
  return {
    supportedLanguages: ["pt-BR", "en-US"],
    inputSchema: [
      {
        key: "topic",
        label: "Topic",
        type: "string",
        required: true,
        highImpact: true,
        helpText: `Describe the main subject for ${label}.`
      }
    ],
    briefingGuidance: {
      objective: `Generate a useful ${label.toLowerCase()} brief.`,
      tips: ["State the topic clearly.", "Include the intended audience."],
      exampleBriefing: `I want a ${contentTypeId} about a practical topic.`,
      commonMistakes: ["Too much context without a clear goal."]
    }
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
