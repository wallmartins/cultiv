import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier,
  GenerationScope
} from "@my-ai-orchestrator/contracts";
import {
  PHASE1_DEFAULT_LENGTH_BY_INTENT,
  PHASE1_WORD_TARGETS,
  resolvePhase1LegacyContentTypeId
} from "@my-ai-orchestrator/contracts";

export interface ResolvedGenerationIntent {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly legacyContentTypeId: string;
  readonly wordTarget: { readonly min: number; readonly max: number };
  readonly channelHint: GenerationChannel;
}

export function defaultLengthTierForIntent(intent: GenerationIntent): GenerationLengthTier {
  return PHASE1_DEFAULT_LENGTH_BY_INTENT[intent];
}

export function resolveGenerationIntent(input: {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
}): ResolvedGenerationIntent {
  const channelHint = input.scope.channel ?? "unspecified";
  const legacyContentTypeId = resolvePhase1LegacyContentTypeId(input.intent, input.scope.lengthTier);

  return {
    intent: input.intent,
    scope: input.scope,
    legacyContentTypeId,
    wordTarget: PHASE1_WORD_TARGETS[input.scope.lengthTier],
    channelHint
  };
}
