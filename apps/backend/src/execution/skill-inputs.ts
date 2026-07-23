import type { SkillExecutionContext } from "@my-ai-orchestrator/skills";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";

import { stripRuntimeMetadata } from "./pipeline/sanitized-generation-input.js";

// Compositor/runtime parameters ride alongside the briefing fields on the spread pipeline inputs
// (public-generation buildCompositorPipelineInputs). They are not briefing content, so the fallback
// serialization must not leak them into {{briefingText}} — the labeled branch already ignores them.
const NON_BRIEFING_INPUT_KEYS = new Set([
  "importedContext",
  "wordTarget",
  "expressionProfile",
  "rhetoricalMode",
  "genre"
]);

export function resolveLanguage(context: SkillExecutionContext): string | undefined {
  const language = context.inputs.language;
  if (typeof language === "string" && language.trim().length > 0) {
    return language;
  }

  const configLanguage = context.config?.language;
  if (typeof configLanguage === "string" && configLanguage.trim().length > 0) {
    return configLanguage;
  }

  return undefined;
}

export function getBriefingSample(inputs: Readonly<Record<string, unknown>>): string {
  return getBriefingText(inputs);
}

export function getBriefingText(inputs: Readonly<Record<string, unknown>>): string {
  const importedContext = getImportedContextText(inputs);
  const generationPayload = stripRuntimeMetadata(inputs);
  const briefing = generationPayload.briefing;
  if (typeof briefing === "string") {
    return appendImportedContext(briefing, importedContext);
  }

  if (briefing && typeof briefing === "object") {
    const summary = briefing as Record<string, unknown>;
    const topic = typeof summary.topic === "string" ? summary.topic : undefined;
    const audience = typeof summary.audience === "string" ? summary.audience : undefined;
    const payload = typeof summary.payload === "string" ? summary.payload : undefined;
    const anchor = typeof summary.anchor === "string" ? summary.anchor : undefined;
    const resistance = typeof summary.resistance === "string" ? summary.resistance : undefined;
    const stake = typeof summary.stake === "string" ? summary.stake : undefined;

    return appendImportedContext([
      topic ? `Topic: ${topic}` : undefined,
      audience ? `Audience: ${audience}` : undefined,
      payload ? `Payload: ${payload}` : undefined,
      anchor ? `Anchor: ${anchor}` : undefined,
      resistance ? `Resistance: ${resistance}` : undefined,
      stake ? `Stake: ${stake}` : undefined
    ]
      .filter((part): part is string => typeof part === "string")
      .join(" | "), importedContext);
  }

  const fallbackPayload = Object.fromEntries(
    Object.entries(generationPayload).filter(([key]) => !NON_BRIEFING_INPUT_KEYS.has(key))
  );
  return appendImportedContext(JSON.stringify(fallbackPayload), importedContext);
}

export function getTopic(
  inputs: Readonly<Record<string, unknown>>,
  state: Readonly<Record<string, unknown>>,
  fallback: string
): string {
  const briefing = inputs.briefing;
  if (briefing && typeof briefing === "object") {
    const topic = (briefing as Record<string, unknown>).topic;
    if (typeof topic === "string" && topic.trim().length > 0) {
      return topic;
    }
  }

  if (typeof state.topic === "string" && state.topic.trim().length > 0) {
    return state.topic;
  }

  if (typeof inputs.topic === "string" && inputs.topic.trim().length > 0) {
    return inputs.topic;
  }

  const generationPayload = stripRuntimeMetadata(inputs);
  if (typeof generationPayload.topic === "string" && generationPayload.topic.trim().length > 0) {
    return generationPayload.topic;
  }

  return fallback;
}

export function normalizeOutput(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

export function normalizeVoiceExamples(value: unknown): readonly unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

export function formatSignalList(signals: readonly string[], emptyLabel: string): string {
  return signals.length > 0
    ? signals.map((signal) => `- ${signal}`).join("\n")
    : emptyLabel;
}

export function formatVoiceExamples(examples: readonly string[] | undefined): string {
  if (!examples || examples.length === 0) {
    return "- (no examples provided; match tone, cadence, rules, and style markers above)";
  }

  return examples
    .map((text, index) => `Example ${index + 1}:\n${text.trim()}`)
    .join("\n\n---\n\n");
}

export function collectVoiceAntiPatterns(profile: {
  readonly antiPatterns?: readonly string[];
  readonly antiPatternsExplicit?: readonly string[];
} | undefined): readonly string[] {
  const merged = [
    ...(profile?.antiPatterns ?? []),
    ...(profile?.antiPatternsExplicit ?? [])
  ];

  return [...new Set(merged.filter((signal) => signal.trim().length > 0))];
}

export function collectVoiceExampleTexts(profile: Partial<VoiceProfile> | undefined): readonly string[] {
  const signaturePhrases = [
    ...(profile?.signatureOpenings ?? []),
    ...(profile?.signatureClosings ?? [])
  ];

  return signaturePhrases
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 0);
}

export function normalizeViolations(value: unknown): readonly unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function getImportedContextText(inputs: Readonly<Record<string, unknown>>): string | undefined {
  const importedContext = inputs.importedContext;
  return typeof importedContext === "string" && importedContext.trim().length > 0
    ? importedContext.trim()
    : undefined;
}

function appendImportedContext(base: string, importedContext: string | undefined): string {
  if (!importedContext) {
    return base;
  }

  return `${base}${base.length > 0 ? " | " : ""}Imported context: ${importedContext}`;
}
