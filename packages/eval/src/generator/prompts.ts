import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type { QualityMode } from "../types.js";

export interface PromptContext {
  readonly briefing: string;
  readonly contentType: string;
  readonly qualityMode: QualityMode;
  readonly voiceProfile: TextQualityVoiceProfile | undefined;
  readonly previousContent?: string;
}

export function buildVoiceContext(voiceProfile: TextQualityVoiceProfile | undefined): string {
  if (!voiceProfile) {
    return "No voice profile provided. Write in a natural, clear style.";
  }

  const parts: string[] = [];

  if (voiceProfile.description) {
    parts.push(`Voice description: ${voiceProfile.description}`);
  }

  if (voiceProfile.tone) {
    parts.push(`Tone: ${voiceProfile.tone}`);
  }

  if (voiceProfile.cadence) {
    parts.push(`Cadence: ${voiceProfile.cadence}`);
  }

  const core = voiceProfile.coreReasoningSignature;
  if (core) {
    parts.push("== AUTHOR REASONING ==");
    parts.push(core.narrativeProse);
    parts.push(`Certainty: ${core.certaintyLevel}; Judgment: ${core.judgmentFrequency}; Conclusion pace: ${core.conclusionPace}`);
  }

  const development = voiceProfile.argumentDevelopmentSignature;
  if (development) {
    parts.push("== ARGUMENT DEVELOPMENT ==");
    parts.push(development.developmentProse);
    parts.push(`Epistemic posture: ${development.epistemicPosture}`);
    parts.push(`Typical moves: ${development.moveLabels.join(", ")}`);
  }

  if (voiceProfile.antiPatternsExplicit && voiceProfile.antiPatternsExplicit.length > 0) {
    parts.push(`Avoid: ${voiceProfile.antiPatternsExplicit.join("; ")}`);
  }

  if (voiceProfile.derivedAntiPatterns && voiceProfile.derivedAntiPatterns.length > 0) {
    parts.push(`Derived anti-patterns: ${voiceProfile.derivedAntiPatterns.join("; ")}`);
  }

  return parts.join("\n\n");
}

export function buildSystemRules(context: PromptContext): string {
  const voiceBlock = buildVoiceContext(context.voiceProfile);

  return [
    "You are an author writing in a specific personal voice.",
    "Follow the voice profile below closely. Do not drift into generic AI tone.",
    "Do not use clichés, LLM tics, or meta-commentary.",
    "Do not include section headers, markdown formatting, or prompt echo.",
    "",
    voiceBlock
  ].join("\n");
}

export function buildHookPrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = buildSystemRules(context);
  const user = [
    `Content type: ${context.contentType}`,
    `Quality mode: ${context.qualityMode}`,
    `Briefing: ${context.briefing}`,
    "",
    "Write only the opening hook (1-3 sentences). It should sound like the author and pull the reader into the topic."
  ].join("\n");

  return { system, user };
}

export function buildDraftPrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = buildSystemRules(context);
  const userParts = [
    `Content type: ${context.contentType}`,
    `Quality mode: ${context.qualityMode}`,
    `Briefing: ${context.briefing}`
  ];

  if (context.previousContent) {
    userParts.push("", "Build on the previous text:", context.previousContent);
  }

  userParts.push(
    "",
    "Write the full draft in the author's voice. Stay grounded in the briefing, avoid easy slogans, and let the conclusion follow from the evidence."
  );

  return { system, user: userParts.join("\n") };
}

export function buildOutlinePrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = buildSystemRules(context);
  const user = [
    `Content type: ${context.contentType}`,
    `Briefing: ${context.briefing}`,
    "",
    "Write a short outline (3-5 bullets) for a piece in the author's voice. Each bullet should be a sentence, not a heading."
  ].join("\n");

  return { system, user };
}

export function buildRefinePrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = [
    buildSystemRules(context),
    "",
    "Your job is to refine the draft while preserving the author's voice. Tighten sentences, remove clichés and filler, and improve flow. Do not rewrite in a generic style."
  ].join("\n");

  const user = [
    `Content type: ${context.contentType}`,
    `Briefing: ${context.briefing}`,
    "",
    "Draft to refine:",
    context.previousContent ?? ""
  ].join("\n");

  return { system, user };
}

export function buildTightenPrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = [
    buildSystemRules(context),
    "",
    "Tighten the thread. Keep every sentence earning its place. Remove filler and repetition. Preserve the author's voice."
  ].join("\n");

  const user = [
    `Content type: ${context.contentType}`,
    "Thread draft:",
    context.previousContent ?? ""
  ].join("\n");

  return { system, user };
}

export function buildFinalizePrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = [
    buildSystemRules(context),
    "",
    "Polish the final text. Check that the voice is consistent and the conclusion lands where the evidence points. Make minimal edits."
  ].join("\n");

  const user = [
    `Content type: ${context.contentType}`,
    `Briefing: ${context.briefing}`,
    "",
    "Draft to finalize:",
    context.previousContent ?? ""
  ].join("\n");

  return { system, user };
}

export function buildSanitizePrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = [
    "You are a final output sanitizer.",
    "Remove any remaining prompt echo, meta-commentary, section headers, markdown formatting, or instructions.",
    "Return only the clean text. Do not change the author's voice or substance."
  ].join("\n");

  const user = [
    `Content type: ${context.contentType}`,
    "",
    "Text to sanitize:",
    context.previousContent ?? ""
  ].join("\n");

  return { system, user };
}

export function buildAnalyzePrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = buildSystemRules(context);
  const user = [
    `Content type: ${context.contentType}`,
    `Briefing: ${context.briefing}`,
    "",
    "Briefly analyze the angle and key points the author would make. Write 2-3 short paragraphs in the author's voice."
  ].join("\n");

  return { system, user };
}

export function buildStructurePrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = buildSystemRules(context);
  const user = [
    `Content type: ${context.contentType}`,
    `Briefing: ${context.briefing}`,
    "",
    "Provide a short structural plan: opening move, development sequence, and closing move. Use the author's typical moves."
  ].join("\n");

  return { system, user };
}

export function buildResearchPrompt(context: PromptContext): { readonly system: string; readonly user: string } {
  const system = buildSystemRules(context);
  const user = [
    `Content type: ${context.contentType}`,
    `Briefing: ${context.briefing}`,
    "",
    "List 3-5 key angles or facts the author might draw on. Keep notes in the author's observational style."
  ].join("\n");

  return { system, user };
}
