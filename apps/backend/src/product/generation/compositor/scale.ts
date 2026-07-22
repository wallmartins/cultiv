import type { GenerationChannel, GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";
import { channelPrimaryContentType } from "../channel-content-types.js";

// Word target is a function of size (lengthTier) and channel, not of genre — the rhetorical mode
// shapes how the piece reads, not how long it is. The channel's canonical format (whose word-count
// band `resolveEffectiveWordTarget` knows) comes from the shared channel↔content-type source (FU-4).
export function resolveWordTarget(args: {
  readonly lengthTier: GenerationLengthTier;
  readonly channel?: GenerationChannel;
}): { readonly min: number; readonly max: number } {
  const channel = args.channel ?? "unspecified";
  return toIntentWordTarget(
    resolveEffectiveWordTarget({
      contentType: channelPrimaryContentType(channel),
      lengthTier: args.lengthTier,
      channel: args.channel
    })
  );
}

export function gateHeavySteps(lengthTier: GenerationLengthTier): boolean {
  return lengthTier === "long";
}
