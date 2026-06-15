import { resolveOutputWordTargetForFormatName, type OutputWordTarget } from "../format/word-targets.js";
import { classifyGenerationDomain, type DomainProfile } from "./domain-classifier.js";

export interface GenerationContext {
  readonly contentType: string;
  readonly domain: DomainProfile;
  readonly wordTarget: OutputWordTarget;
}

export function buildGenerationContext(input: {
  readonly contentType: string;
  readonly briefing: string;
  readonly topic?: string;
}): GenerationContext {
  const contentType = input.contentType.trim();
  return {
    contentType,
    domain: classifyGenerationDomain({
      contentType,
      briefing: input.briefing,
      topic: input.topic
    }),
    wordTarget: resolveOutputWordTargetForFormatName(contentType)
  };
}
