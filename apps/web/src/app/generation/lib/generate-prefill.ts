import type {
  GenerationIntent,
  GenerationLengthTier,
  GenerationScope,
  QualityMode
} from "@my-ai-orchestrator/contracts";

const PREFILL_KEY = "cultiv.generate.prefill";

/** @phase1-legacy — mirrors backend intent-resolver map for prefill + field labels */
const PHASE1_LEGACY_INTENT_MAP: Record<GenerationIntent, Record<GenerationLengthTier, string>> = {
  "share-idea": { short: "linkedin-post", medium: "linkedin-post", long: "long-form-blog" },
  "explain-deeply": { short: "validation-post", medium: "architecture-post", long: "long-form-blog" },
  "engage-audience": { short: "validation-post", medium: "linkedin-post", long: "newsletter" },
  "tell-story": { short: "twitter-thread", medium: "twitter-thread", long: "long-form-blog" },
  "update-subscribers": { short: "linkedin-post", medium: "newsletter", long: "newsletter" },
  "document-decision": { short: "validation-post", medium: "architecture-post", long: "architecture-post" }
};

const DEFAULT_LENGTH_BY_INTENT: Record<GenerationIntent, GenerationLengthTier> = {
  "share-idea": "short",
  "explain-deeply": "long",
  "engage-audience": "short",
  "tell-story": "medium",
  "update-subscribers": "long",
  "document-decision": "medium"
};

export type GeneratePrefill = {
  readonly contentType?: string;
  readonly intent?: GenerationIntent;
  readonly scope?: GenerationScope;
  readonly briefing?: Record<string, unknown>;
  readonly language?: string;
  readonly qualityMode?: QualityMode;
  readonly importedContext?: string;
};

export function resolveLegacyContentTypeId(
  intent: GenerationIntent,
  lengthTier: GenerationLengthTier
): string {
  return PHASE1_LEGACY_INTENT_MAP[intent][lengthTier];
}

export function mapLegacyContentTypeToIntent(
  contentType: string
): { readonly intent: GenerationIntent; readonly scope: GenerationScope } | null {
  const matches: Array<{ readonly intent: GenerationIntent; readonly lengthTier: GenerationLengthTier }> =
    [];

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

  const preferred = matches.find((match) => match.lengthTier === DEFAULT_LENGTH_BY_INTENT[match.intent]);
  const selected = preferred ?? matches[0]!;

  return {
    intent: selected.intent,
    scope: { lengthTier: selected.lengthTier }
  };
}

export function storeGeneratePrefill(prefill: GeneratePrefill): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
}

export function consumeGeneratePrefill(): GeneratePrefill | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PREFILL_KEY);
  window.sessionStorage.removeItem(PREFILL_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GeneratePrefill;
  } catch {
    return null;
  }
}
