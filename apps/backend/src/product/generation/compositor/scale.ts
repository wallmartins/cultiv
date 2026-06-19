import type { GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import { PHASE1_WORD_TARGETS } from "@my-ai-orchestrator/contracts";

export function resolveWordTarget(lengthTier: GenerationLengthTier): { readonly min: number; readonly max: number } {
  return PHASE1_WORD_TARGETS[lengthTier];
}

export function gateHeavySteps(lengthTier: GenerationLengthTier): boolean {
  return lengthTier === "long";
}
