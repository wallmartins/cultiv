import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";
import {
  collectVoiceAntiPatterns,
  collectVoiceExampleTexts,
  formatSignalList,
  formatVoiceExamples
} from "../skill-inputs.js";
import { formatAuthorReasoningBlock, formatAuthorReasoningSection } from "./reasoning-prompt.js";
import {
  formatArgumentDevelopmentBlock,
  formatArgumentDevelopmentSection
} from "./development-prompt.js";

export interface StepVoiceContext {
  readonly voiceExamples: string;
  readonly lexicon: string;
  readonly antiPatterns: string;
  readonly styleMarkers: string;
  readonly voiceRules: string;
  readonly voiceConstraints: string;
  readonly authorReasoningSection: string;
  readonly authorReasoning: string;
  readonly authorDevelopmentSection: string;
  readonly authorDevelopment: string;
}

export function buildStepVoiceContext(
  stepName: string,
  voiceProfile: Partial<VoiceProfile> | undefined
): StepVoiceContext {
  const exampleTexts = collectVoiceExampleTexts(voiceProfile);
  const antiPatterns = collectVoiceAntiPatterns(voiceProfile);
  const styleMarkers = voiceProfile?.styleMarkers ?? [];
  const voiceRules = voiceProfile?.rules ?? [];
  const voiceConstraints = voiceProfile?.constraints ?? [];
  const lexicon = voiceProfile?.lexicon ?? [];
  const authorReasoning = formatAuthorReasoningBlock(
    stepName,
    voiceProfile?.coreReasoningSignature,
    voiceProfile?.formatExpressionProfile
  );
  const authorReasoningSection = formatAuthorReasoningSection(
    stepName,
    voiceProfile?.coreReasoningSignature,
    voiceProfile?.formatExpressionProfile
  );
  const authorDevelopment = formatArgumentDevelopmentBlock(
    stepName,
    voiceProfile?.argumentDevelopmentSignature
  );
  const authorDevelopmentSection = formatArgumentDevelopmentSection(
    stepName,
    voiceProfile?.argumentDevelopmentSignature
  );

  const baseVoiceContext = {
    authorReasoning,
    authorReasoningSection,
    authorDevelopment,
    authorDevelopmentSection
  };

  switch (stepName) {
    case "hook":
      return {
        voiceExamples: formatVoiceExamples(exampleTexts.slice(0, 1)),
        lexicon: formatSignalList([], "- (none for this step)"),
        antiPatterns: formatSignalList(antiPatterns, "- (none specified)"),
        styleMarkers: formatSignalList(styleMarkers, "- (none specified)"),
        voiceRules: formatSignalList(voiceRules, "- (none specified)"),
        voiceConstraints: formatSignalList(voiceConstraints, "- (none specified)"),
        ...baseVoiceContext
      };
    case "outline":
    case "structure":
    case "research":
      return {
        voiceExamples: formatVoiceExamples(exampleTexts.slice(0, 2)),
        lexicon: formatSignalList(lexicon.slice(0, 2), "- (none specified)"),
        antiPatterns: formatSignalList(antiPatterns, "- (none specified)"),
        styleMarkers: formatSignalList(styleMarkers, "- (none specified)"),
        voiceRules: formatSignalList(voiceRules, "- (none specified)"),
        voiceConstraints: formatSignalList(voiceConstraints, "- (none specified)"),
        ...baseVoiceContext
      };
    case "draft":
    case "expand":
      return {
        voiceExamples: formatVoiceExamples(exampleTexts),
        lexicon: formatSignalList(lexicon.slice(0, 3), "- (none specified)"),
        antiPatterns: formatSignalList(antiPatterns, "- (none specified)"),
        styleMarkers: formatSignalList(styleMarkers, "- (none specified)"),
        voiceRules: formatSignalList(voiceRules, "- (none specified)"),
        voiceConstraints: formatSignalList(voiceConstraints, "- (none specified)"),
        ...baseVoiceContext
      };
    case "refine":
      return {
        voiceExamples: formatVoiceExamples(exampleTexts.slice(0, 2)),
        lexicon: formatSignalList([], "- (none for this step)"),
        antiPatterns: formatSignalList(antiPatterns, "- (none specified)"),
        styleMarkers: formatSignalList(styleMarkers, "- (none specified)"),
        voiceRules: formatSignalList(voiceRules, "- (none specified)"),
        voiceConstraints: formatSignalList(voiceConstraints, "- (none specified)"),
        ...baseVoiceContext
      };
    case "tighten":
    case "analyze":
      return {
        voiceExamples: formatVoiceExamples([]),
        lexicon: formatSignalList([], "- (none for this step)"),
        antiPatterns: formatSignalList(antiPatterns, "- (none specified)"),
        styleMarkers: formatSignalList(styleMarkers, "- (none specified)"),
        voiceRules: formatSignalList(voiceRules, "- (none specified)"),
        voiceConstraints: formatSignalList(voiceConstraints, "- (none specified)"),
        ...baseVoiceContext
      };
    default:
      return {
        voiceExamples: formatVoiceExamples(exampleTexts.slice(0, 3)),
        lexicon: formatSignalList(lexicon.slice(0, 3), "- (none specified)"),
        antiPatterns: formatSignalList(antiPatterns, "- (none specified)"),
        styleMarkers: formatSignalList(styleMarkers, "- (none specified)"),
        voiceRules: formatSignalList(voiceRules, "- (none specified)"),
        voiceConstraints: formatSignalList(voiceConstraints, "- (none specified)"),
        ...baseVoiceContext
      };
  }
}

export function buildAdapterStepContext(
  stepName: string,
  state: Readonly<Record<string, unknown>>,
  inputs: Readonly<Record<string, unknown>>
): Record<string, unknown> {
  const briefing = pickString(state.briefing) ?? pickString(inputs.briefing);
  const topic = pickString(state.topic) ?? pickString(inputs.topic);

  switch (stepName) {
    case "hook":
      return compactRecord({ topic, briefing });
    case "outline":
    case "structure":
    case "research":
      return compactRecord({
        topic,
        briefing,
        previous: pickPreviousOutput(state, ["research", "outline", "structure"])
      });
    case "draft":
    case "expand":
      return compactRecord({
        topic,
        briefing,
        previous: pickPreviousOutput(state, ["hook", "outline", "structure", "research", "analyze"])
      });
    case "refine":
      return compactRecord({
        topic,
        briefingSummary: summarizeBriefing(briefing),
        previous: pickPreviousOutput(state, ["draft", "expand", "hook"])
      });
    case "tighten": {
      const generationContext = state.generationContext;
      const wordTarget =
        generationContext
        && typeof generationContext === "object"
        && "wordTarget" in generationContext
          ? (generationContext as { readonly wordTarget?: unknown }).wordTarget
          : undefined;

      return compactRecord({
        topic,
        wordTarget,
        previous: pickPreviousOutput(state, ["refine", "draft", "expand"])
      });
    }
    case "analyze":
      return compactRecord({ topic, briefing });
    default:
      return compactRecord({
        topic,
        briefing,
        previous: pickPreviousOutput(state, ["refine", "draft", "expand", "hook"])
      });
  }
}

function pickPreviousOutput(state: Readonly<Record<string, unknown>>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = state[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function summarizeBriefing(briefing: string | undefined): string | undefined {
  if (!briefing) {
    return undefined;
  }

  return briefing.length > 320 ? `${briefing.slice(0, 320).trim()}...` : briefing;
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
