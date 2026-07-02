import type { MetaphorSignature, TraitFrequency } from "@my-ai-orchestrator/contracts";
import { formatMetaphorStylePromptBlock as formatMetaphorStylePromptBlockFromContracts } from "@my-ai-orchestrator/contracts";
import { CALIBRATION_WIZARD_STEPS } from "@my-ai-orchestrator/domain";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { extractTopicKeywords } from "./voice-signature-brief.js";
import { isWizardVoiceExample, resolveWizardTopicTag } from "./wizard-voice-examples.js";

export type { MetaphorSignature } from "@my-ai-orchestrator/contracts";

export const formatMetaphorStylePromptBlock = formatMetaphorStylePromptBlockFromContracts;

const EXPLICIT_COMPARISON_MARKERS =
  /\b(e como|como se|parece um|parece uma|similar a|like a|as if|just like|semelhante a)\b/gi;
const INVITATION_MARKERS =
  /\b(imagina que|pensa em|pense em|think of|picture this|imagine que|imagine that)\b/gi;
const IMPLICIT_ANALOGY_MARKERS = /\b(analogia|analogy|metafora|metaphor|lembra|reminds me of)\b/gi;
const METAPHOR_DOMAIN_PATTERNS = [
  /\b(?:e como|like a|as if|just like|semelhante a)\s+(?:um|uma|o|a|the|an)\s+([a-z0-9]{4,})/gi,
  /\b(?:e como|like a|as if|just like|semelhante a)[^.!?]{0,40}?\b(?:um|uma|o|a|the|an)\s+([a-z0-9]{4,})/gi,
  /\b(?:parece um|parece uma|similar a)\s+([a-z0-9]{4,})/gi,
  /\b(?:imagina que|pensa em|pense em|think of|picture this|imagine que|imagine that)[^.!?]{0,100}?\b(?:um|uma|o|a|the|an)\s+([a-z0-9]{4,})/gi
] as const;

const WIZARD_STEP_TOPIC_TAGS = new Set<string>(CALIBRATION_WIZARD_STEPS.map((step) => step.id));
const DOMAIN_STOPWORDS = new Set([
  "algo",
  "coisa",
  "thing",
  "something",
  "someone",
  "alguem",
  "pessoa",
  "person",
  "forma",
  "way",
  "modo",
  "mode",
  "tipo",
  "kind"
]);

const FREQUENCY_ORDER: readonly TraitFrequency[] = ["rare", "occasional", "common", "dominant"];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countMatches(text: string, pattern: RegExp): number {
  return [...normalizeText(text).matchAll(new RegExp(pattern.source, pattern.flags))].length;
}

function densityFromRatio(ratio: number): TraitFrequency {
  if (ratio <= 0) {
    return "rare";
  }
  if (ratio < 0.34) {
    return "occasional";
  }
  if (ratio < 0.67) {
    return "common";
  }
  return "dominant";
}

function maxFrequency(left: TraitFrequency, right: TraitFrequency): TraitFrequency {
  return FREQUENCY_ORDER.indexOf(left) >= FREQUENCY_ORDER.indexOf(right) ? left : right;
}

function resolveAnalogyMode(
  explicitCount: number,
  invitationCount: number,
  implicitCount: number
): MetaphorSignature["analogyMode"] {
  const modes = [
    explicitCount > 0 ? "explicit-comparison" : undefined,
    invitationCount > 0 ? "invitation" : undefined,
    implicitCount > 0 ? "implicit" : undefined
  ].filter((mode): mode is Exclude<MetaphorSignature["analogyMode"], "mixed" | "none"> => mode !== undefined);

  if (modes.length === 0) {
    return "none";
  }

  if (modes.length >= 2) {
    return "mixed";
  }

  return modes[0]!;
}

function extractMetaphorDomainWords(text: string): readonly string[] {
  const domains = new Set<string>();
  const normalizedText = normalizeText(text);

  for (const pattern of METAPHOR_DOMAIN_PATTERNS) {
    for (const match of normalizedText.matchAll(new RegExp(pattern.source, pattern.flags))) {
      const candidate = match[1]?.trim();
      if (!candidate) {
        continue;
      }

      const normalized = normalizeText(candidate);
      if (normalized.length >= 4 && !DOMAIN_STOPWORDS.has(normalized)) {
        domains.add(normalized);
      }
    }
  }

  return [...domains];
}

function resolveAvoidLiteralDomains(examples: readonly VoiceExampleRecord[]): readonly string[] {
  const domains = new Set<string>();

  for (const keyword of extractTopicKeywords(examples)) {
    domains.add(keyword);
  }

  for (const example of examples) {
    const topicTag = resolveWizardTopicTag(example);
    if (!WIZARD_STEP_TOPIC_TAGS.has(topicTag)) {
      for (const token of normalizeText(topicTag).split(/[^a-z0-9]+/i)) {
        if (token.length >= 4 && !DOMAIN_STOPWORDS.has(token)) {
          domains.add(token);
        }
      }
    }

    for (const domain of extractMetaphorDomainWords(example.text)) {
      domains.add(domain);
    }
  }

  return [...domains].slice(0, 12);
}

export function deriveMetaphorSignature(
  examples: readonly VoiceExampleRecord[],
  usesAnalogies?: TraitFrequency
): MetaphorSignature | undefined {
  const wizardExamples = examples.filter(
    (example) => example.state === "active" && isWizardVoiceExample(example)
  );
  if (wizardExamples.length === 0) {
    return undefined;
  }

  let explicitCount = 0;
  let invitationCount = 0;
  let implicitCount = 0;
  let examplesWithAnalogies = 0;

  for (const example of wizardExamples) {
    const explicit = countMatches(example.text, EXPLICIT_COMPARISON_MARKERS);
    const invitation = countMatches(example.text, INVITATION_MARKERS);
    const implicit = countMatches(example.text, IMPLICIT_ANALOGY_MARKERS);
    explicitCount += explicit;
    invitationCount += invitation;
    implicitCount += implicit;

    if (explicit + invitation + implicit > 0) {
      examplesWithAnalogies += 1;
    }
  }

  const markerRatio = examplesWithAnalogies / wizardExamples.length;
  let analogyDensity = densityFromRatio(markerRatio);
  if (usesAnalogies && usesAnalogies !== "rare") {
    analogyDensity = maxFrequency(analogyDensity, usesAnalogies);
  }

  return {
    analogyDensity,
    analogyMode: resolveAnalogyMode(explicitCount, invitationCount, implicitCount),
    avoidLiteralDomains: resolveAvoidLiteralDomains(wizardExamples)
  };
}
