import type { DomainProfile, GenerationDomain } from "@my-ai-orchestrator/text-quality";

export function resolvePromptDomainPolicy(domain: DomainProfile): string {
  switch (domain.domain) {
    case "non-technical":
      return [
        "Generation domain: non-technical.",
        "Do not use technical jargon, software metaphors, tool names, product names, or engineering imagery.",
        "Only quote technical wording if it appears literally in the briefing.",
        "Choose metaphors and examples that match the briefing topic and audience (career, learning, relationships, communication, daily life)."
      ].join(" ");
    case "technical":
      return [
        "Generation domain: technical.",
        "Use precise technical terminology when it serves the briefing.",
        "Still avoid repeating the same term unnecessarily and do not pad the text with jargon."
      ].join(" ");
    case "mixed":
      return [
        "Generation domain: mixed.",
        "Use technical terms only where the briefing requires them.",
        "Keep the rest in accessible language and avoid defaulting to software metaphors."
      ].join(" ");
  }
}

export function resolveGenerationDomainLabel(domain: GenerationDomain): string {
  return domain;
}

export function resolveLexiconInstruction(domain: DomainProfile): string {
  if (domain.domain === "non-technical") {
    return "Author lexicon (distinctive words from the author; use sparingly, never repeat a term more than once unless essential, never use technical jargon from training examples):";
  }

  return "Author lexicon (distinctive words from the author; use sparingly, never repeat a term more than once unless essential):";
}
