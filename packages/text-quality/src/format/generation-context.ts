import type { PracticeProfile } from "@my-ai-orchestrator/contracts";
import { resolveOutputWordTargetForFormatName, type OutputWordTarget } from "./word-targets.js";

export interface GenerationContext {
  readonly contentType: string;
  readonly wordTarget: OutputWordTarget;
  // F0-1 — value only, no population yet. Real threading from the pipeline is F4.
  readonly practiceProfile?: PracticeProfile;
}

export function buildGenerationContext(input: {
  readonly contentType: string;
  readonly practiceProfile?: PracticeProfile;
}): GenerationContext {
  const contentType = input.contentType.trim();
  return {
    contentType,
    wordTarget: resolveOutputWordTargetForFormatName(contentType),
    practiceProfile: input.practiceProfile
  };
}
