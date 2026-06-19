import type { GenerationIntent, GenerationLengthTier, GenerationScope } from "./generation-intent.js";

/** @phase1-legacy — replaced by generationProfile in Phase 2 */
export const PHASE1_LEGACY_INTENT_MAP: Record<
  GenerationIntent,
  Record<GenerationLengthTier, string>
> = {
  "share-idea": { short: "linkedin-post", medium: "linkedin-post", long: "long-form-blog" },
  "explain-deeply": { short: "validation-post", medium: "architecture-post", long: "long-form-blog" },
  "engage-audience": { short: "validation-post", medium: "linkedin-post", long: "newsletter" },
  "tell-story": { short: "twitter-thread", medium: "twitter-thread", long: "long-form-blog" },
  "update-subscribers": { short: "linkedin-post", medium: "newsletter", long: "newsletter" },
  "document-decision": { short: "validation-post", medium: "architecture-post", long: "architecture-post" }
};

export const PHASE1_WORD_TARGETS: Record<GenerationLengthTier, { readonly min: number; readonly max: number }> = {
  short: { min: 150, max: 400 },
  medium: { min: 400, max: 1200 },
  long: { min: 1200, max: 3500 }
};

export const PHASE1_DEFAULT_LENGTH_BY_INTENT: Record<GenerationIntent, GenerationLengthTier> = {
  "share-idea": "short",
  "explain-deeply": "long",
  "engage-audience": "short",
  "tell-story": "medium",
  "update-subscribers": "long",
  "document-decision": "medium"
};

export function resolvePhase1LegacyContentTypeId(
  intent: GenerationIntent,
  lengthTier: GenerationLengthTier
): string {
  return PHASE1_LEGACY_INTENT_MAP[intent][lengthTier];
}

export function mapLegacyContentTypeToPhase1Intent(
  contentType: string
): { readonly intent: GenerationIntent; readonly scope: GenerationScope } | null {
  const matches: Array<{ readonly intent: GenerationIntent; readonly lengthTier: GenerationLengthTier }> = [];

  for (const intent of Object.keys(PHASE1_LEGACY_INTENT_MAP) as GenerationIntent[]) {
    for (const lengthTier of Object.keys(PHASE1_LEGACY_INTENT_MAP[intent]) as GenerationLengthTier[]) {
      if (PHASE1_LEGACY_INTENT_MAP[intent][lengthTier] === contentType) {
        matches.push({ intent, lengthTier });
      }
    }
  }

  if (matches.length === 0) {
    return null;
  }

  const preferred = matches.find((match) => match.lengthTier === PHASE1_DEFAULT_LENGTH_BY_INTENT[match.intent]);
  const selected = preferred ?? matches[0]!;

  return {
    intent: selected.intent,
    scope: { lengthTier: selected.lengthTier }
  };
}
