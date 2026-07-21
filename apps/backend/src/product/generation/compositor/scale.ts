import type { GenerationChannel, GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";

// Word target is a function of size (lengthTier) and channel, not of genre — the rhetorical mode
// shapes how the piece reads, not how long it is. Each channel maps to the format whose word-count
// band `resolveEffectiveWordTarget` already knows; `unspecified` falls to its default band.
const CHANNEL_WORD_TARGET_FORMAT: Record<GenerationChannel, string> = {
  "professional-network": "linkedin-post",
  social: "twitter-thread",
  email: "newsletter",
  blog: "blog",
  unspecified: ""
};

export function resolveWordTarget(args: {
  readonly lengthTier: GenerationLengthTier;
  readonly channel?: GenerationChannel;
}): { readonly min: number; readonly max: number } {
  const channel = args.channel ?? "unspecified";
  return toIntentWordTarget(
    resolveEffectiveWordTarget({
      contentType: CHANNEL_WORD_TARGET_FORMAT[channel],
      lengthTier: args.lengthTier,
      channel: args.channel
    })
  );
}

export function gateHeavySteps(lengthTier: GenerationLengthTier): boolean {
  return lengthTier === "long";
}
