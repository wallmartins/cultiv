import type { GenerationIntent } from "@my-ai-orchestrator/contracts";

/** Briefing field i18n keys follow input schema presets, not legacy pipeline routing. */
const INTENT_BRIEFING_FIELD_LABEL_KEY: Record<GenerationIntent, string> = {
  "share-idea": "linkedin-post",
  "explain-deeply": "long-form-blog",
  "engage-audience": "validation-post",
  "tell-story": "twitter-thread",
  "update-subscribers": "newsletter",
  "document-decision": "architecture-post"
};

export function resolveIntentBriefingFieldLabelKey(intent: GenerationIntent): string {
  return INTENT_BRIEFING_FIELD_LABEL_KEY[intent];
}
