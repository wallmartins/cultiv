import type {
  GenerationChannel,
  GenerationIntent,
  GenerationLengthTier,
  GenerationScope
} from "@my-ai-orchestrator/contracts";

/** @phase1-legacy — replaced by generationProfile in Phase 2 */
const PHASE1_LEGACY_INTENT_MAP: Record<GenerationIntent, Record<GenerationLengthTier, string>> = {
  "share-idea": { short: "linkedin-post", medium: "linkedin-post", long: "long-form-blog" },
  "explain-deeply": { short: "validation-post", medium: "architecture-post", long: "long-form-blog" },
  "engage-audience": { short: "validation-post", medium: "linkedin-post", long: "newsletter" },
  "tell-story": { short: "twitter-thread", medium: "twitter-thread", long: "long-form-blog" },
  "update-subscribers": { short: "linkedin-post", medium: "newsletter", long: "newsletter" },
  "document-decision": { short: "validation-post", medium: "architecture-post", long: "architecture-post" }
};

const WORD_TARGETS: Record<GenerationLengthTier, { min: number; max: number }> = {
  short: { min: 150, max: 400 },
  medium: { min: 400, max: 1200 },
  long: { min: 1200, max: 3500 }
};

const DEFAULT_LENGTH_BY_INTENT: Record<GenerationIntent, GenerationLengthTier> = {
  "share-idea": "short",
  "explain-deeply": "long",
  "engage-audience": "short",
  "tell-story": "medium",
  "update-subscribers": "long",
  "document-decision": "medium"
};

export interface ResolvedGenerationIntent {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
  readonly legacyContentTypeId: string;
  readonly wordTarget: { readonly min: number; readonly max: number };
  readonly channelHint: GenerationChannel;
}

export function defaultLengthTierForIntent(intent: GenerationIntent): GenerationLengthTier {
  return DEFAULT_LENGTH_BY_INTENT[intent];
}

export function resolveGenerationIntent(input: {
  readonly intent: GenerationIntent;
  readonly scope: GenerationScope;
}): ResolvedGenerationIntent {
  const channelHint = input.scope.channel ?? "unspecified";
  const legacyContentTypeId = PHASE1_LEGACY_INTENT_MAP[input.intent][input.scope.lengthTier];

  return {
    intent: input.intent,
    scope: input.scope,
    legacyContentTypeId,
    wordTarget: WORD_TARGETS[input.scope.lengthTier],
    channelHint
  };
}
