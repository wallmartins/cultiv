import type { VoiceProfileConfidence, VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";

export function hasVoiceProfile(profile: VoiceProfileScreenView | undefined): boolean {
  return (profile?.profile.version ?? 0) > 0;
}

// The backend exposes confidence as a 3-way category, not a percentage (the app-mock's "78" was
// placeholder data) — this maps the category onto a ring fill + short pt-BR copy, never fabricating
// a precise number the backend doesn't give.
const CONFIDENCE_RING_VALUE: Record<VoiceProfileConfidence, number> = { low: 0.35, medium: 0.65, high: 0.9 };
const CONFIDENCE_CAPTION: Record<VoiceProfileConfidence, string> = { low: "Baixa", medium: "Média", high: "Alta" };
const CONFIDENCE_HEADLINE: Record<VoiceProfileConfidence, string> = {
  low: "Voz emergente",
  medium: "Voz em formação",
  high: "Voz sólida"
};

export function confidenceRingValue(confidence: VoiceProfileConfidence): number {
  return CONFIDENCE_RING_VALUE[confidence];
}

export function confidenceCaption(confidence: VoiceProfileConfidence): string {
  return CONFIDENCE_CAPTION[confidence];
}

export function confidenceHeadline(confidence: VoiceProfileConfidence): string {
  return CONFIDENCE_HEADLINE[confidence];
}
