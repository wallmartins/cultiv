/**
 * Marketing catalog synced with `createDefaultOrchestrationCatalog().contentTypes`
 * in `packages/orchestrator/src/catalog.ts` and `CONTENT_TYPE_PRESETS` in the backend.
 */
export const MARKETING_CONTENT_TYPE_IDS = [
  "long-form-blog",
  "validation-post",
  "architecture-post",
  "linkedin-post",
  "twitter-thread",
  "newsletter"
] as const;

export type MarketingContentTypeId = (typeof MARKETING_CONTENT_TYPE_IDS)[number];

export type MarketingContentType = {
  readonly id: MarketingContentTypeId;
  readonly label: string;
  readonly description: string;
};

export function getMarketingContentTypes(
  locale: "pt" | "en",
  labels: Record<MarketingContentTypeId, { readonly label: string; readonly description: string }>
): ReadonlyArray<MarketingContentType> {
  return MARKETING_CONTENT_TYPE_IDS.map((id) => ({
    id,
    label: labels[id].label,
    description: labels[id].description
  }));
}
