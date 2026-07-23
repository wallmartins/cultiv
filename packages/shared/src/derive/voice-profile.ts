import type { VoiceProfileConfidence, VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";

export function hasVoiceProfile(profile: VoiceProfileScreenView | undefined): boolean {
  return (profile?.profile.version ?? 0) > 0;
}

// The backend exposes confidence as a 3-way category, not a percentage (the app-mock's "78" was
// placeholder data) — this maps the category onto a ring fill, never fabricating a precise number
// the backend doesn't give. The caption/headline COPY for these categories lives in the i18n
// dictionary (t.common.confidence), since this package can't hold localized strings.
const CONFIDENCE_RING_VALUE: Record<VoiceProfileConfidence, number> = { low: 0.35, medium: 0.65, high: 0.9 };

export function confidenceRingValue(confidence: VoiceProfileConfidence): number {
  return CONFIDENCE_RING_VALUE[confidence];
}

