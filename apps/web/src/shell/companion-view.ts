import type { VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { confidenceCaption, confidenceHeadline, confidenceRingValue, hasVoiceProfile } from "@my-ai-orchestrator/shared";
import type { VoiceCompanionContent } from "@my-ai-orchestrator/ui/app";

export function buildCompanionContent(
  locked: boolean,
  profile: VoiceProfileScreenView | undefined,
  onNavigateVoice: () => void
): VoiceCompanionContent {
  if (locked) {
    return { kind: "locked", onCalibrate: onNavigateVoice };
  }

  if (!profile || !hasVoiceProfile(profile)) {
    return { kind: "empty", onCalibrate: onNavigateVoice };
  }

  const confidence = profile.profile.confidence;
  return {
    kind: "ready",
    confidenceValue: confidenceRingValue(confidence),
    confidenceCaption: confidenceCaption(confidence),
    headline: confidenceHeadline(confidence),
    meta: `confiança ${confidenceCaption(confidence).toLowerCase()} · versão ${profile.profile.version}`,
    // Same source fields the route's voice-mappers.ts reads (reasoning.core.narrativeProse,
    // profile.styleMarkers) — no second derivation, just a smaller slice for the 320px widget.
    proseCore: profile.reasoning?.core.narrativeProse ?? "",
    descriptorChips: profile.profile.styleMarkers.slice(0, 3),
    onSeeProfile: onNavigateVoice
  };
}
