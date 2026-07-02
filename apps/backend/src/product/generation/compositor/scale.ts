import type { GenerationLengthTier } from "@my-ai-orchestrator/contracts";
import { resolvePhase1LegacyContentTypeId } from "@my-ai-orchestrator/contracts";
import type { GenerationChannel, GenerationIntent } from "@my-ai-orchestrator/contracts";
import { resolveEffectiveWordTarget, toIntentWordTarget } from "@my-ai-orchestrator/text-quality";

export function resolveWordTarget(args: {
  readonly intent: GenerationIntent;
  readonly lengthTier: GenerationLengthTier;
  readonly channel?: GenerationChannel;
}): { readonly min: number; readonly max: number } {
  const contentType = resolvePhase1LegacyContentTypeId(args.intent, args.lengthTier);
  return toIntentWordTarget(
    resolveEffectiveWordTarget({
      contentType,
      lengthTier: args.lengthTier,
      channel: args.channel
    })
  );
}

export function gateHeavySteps(lengthTier: GenerationLengthTier): boolean {
  return lengthTier === "long";
}
