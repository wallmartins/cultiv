import { textHasNonTechnicalTopicSignals, textHasTechnicalTopicSignals } from "./tech-terms.js";

export type GenerationDomain = "non-technical" | "technical" | "mixed";

export type DomainConfidence = "high" | "medium" | "low";

export interface DomainProfile {
  readonly domain: GenerationDomain;
  readonly confidence: DomainConfidence;
  readonly signals: readonly string[];
  readonly allowTechnicalLexicon: boolean;
  readonly allowTechMetaphors: boolean;
}

export interface ClassifyGenerationDomainInput {
  readonly contentType: string;
  readonly briefing: string;
  readonly topic?: string;
}

const TECHNICAL_CONTENT_TYPES = new Set(["architecture-post", "validation-post"]);

const NON_TECHNICAL_CONTENT_TYPES = new Set(["linkedin-post", "newsletter"]);

export function classifyGenerationDomain(input: ClassifyGenerationDomainInput): DomainProfile {
  const contentType = input.contentType.toLowerCase();
  const corpus = [input.briefing, input.topic ?? ""].filter((part) => part.trim().length > 0).join(" ");
  const signals: string[] = [];
  const hasTechnicalSignals = textHasTechnicalTopicSignals(corpus);
  const hasNonTechnicalSignals = textHasNonTechnicalTopicSignals(corpus);

  if (TECHNICAL_CONTENT_TYPES.has(contentType)) {
    signals.push(`contentType:${contentType}`);
    return finalizeProfile("technical", "high", signals);
  }

  if (NON_TECHNICAL_CONTENT_TYPES.has(contentType) && !hasTechnicalSignals) {
    signals.push(`contentType:${contentType}`);
    if (hasNonTechnicalSignals) {
      signals.push("briefing:non-technical-topic");
    }
    return finalizeProfile("non-technical", hasNonTechnicalSignals ? "high" : "medium", signals);
  }

  if (hasTechnicalSignals && hasNonTechnicalSignals) {
    signals.push("briefing:mixed-signals");
    return finalizeProfile("mixed", "medium", signals);
  }

  if (hasTechnicalSignals) {
    signals.push("briefing:technical-topic");
    return finalizeProfile("technical", "high", signals);
  }

  if (hasNonTechnicalSignals) {
    signals.push("briefing:non-technical-topic");
    return finalizeProfile("non-technical", "high", signals);
  }

  if (NON_TECHNICAL_CONTENT_TYPES.has(contentType)) {
    signals.push(`contentType:${contentType}`);
    return finalizeProfile("non-technical", "medium", signals);
  }

  signals.push("default:briefing-based");
  return finalizeProfile("mixed", "low", signals);
}

function finalizeProfile(
  domain: GenerationDomain,
  confidence: DomainConfidence,
  signals: readonly string[]
): DomainProfile {
  return {
    domain,
    confidence,
    signals,
    allowTechnicalLexicon: domain === "technical" || domain === "mixed",
    allowTechMetaphors: domain === "technical"
  };
}
