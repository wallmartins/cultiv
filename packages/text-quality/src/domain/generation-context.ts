import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import { resolveOutputWordTargetForFormatName, type OutputWordTarget } from "../format/word-targets.js";
import { classifyGenerationDomain, type DomainProfile } from "./domain-classifier.js";

export interface GenerationContext {
  readonly contentType: string;
  readonly domain: DomainProfile;
  readonly wordTarget: OutputWordTarget;
  // F0-1 — value only, no population yet. Real threading from the pipeline is F4.
  readonly practiceProfile?: PracticeProfile;
}

export function buildGenerationContext(input: {
  readonly contentType: string;
  readonly briefing: string;
  readonly topic?: string;
  readonly practiceProfile?: PracticeProfile;
}): GenerationContext {
  const contentType = input.contentType.trim();
  return {
    contentType,
    domain: classifyGenerationDomain({
      contentType,
      briefing: input.briefing,
      topic: input.topic
    }),
    wordTarget: resolveOutputWordTargetForFormatName(contentType),
    practiceProfile: input.practiceProfile
  };
}
