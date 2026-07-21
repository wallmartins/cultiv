import type { VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { confidenceRingValue, hasVoiceProfile } from "@my-ai-orchestrator/shared";
import type { VoiceCompanionContent } from "@my-ai-orchestrator/ui/app";
import { voiceSignalLabel, type AppMessages } from "@my-ai-orchestrator/ui/app/i18n";

export function buildCompanionContent(
  t: AppMessages,
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
  const caption = t.common.confidence.caption[confidence];
  return {
    kind: "ready",
    confidenceValue: confidenceRingValue(confidence),
    confidenceCaption: caption,
    headline: t.common.confidence.headline[confidence],
    meta: t.shell.companion.meta(caption, profile.profile.version),
    // Same source fields the route's voice-mappers.ts reads (reasoning.core.narrativeProse,
    // profile.styleMarkers) — no second derivation, just a smaller slice for the 320px widget.
    proseCore: profile.reasoning?.core.narrativeProse ?? "",
    descriptorChips: profile.profile.styleMarkers.slice(0, 3).map((marker) => voiceSignalLabel(t, marker)),
    onSeeProfile: onNavigateVoice
  };
}
