import type { TextQualityVoiceProfile, VoiceProfileView } from "@my-ai-orchestrator/contracts";
import type { DerivedVoiceProfile } from "./voice.js";

export function toVoiceProfileView(profile: DerivedVoiceProfile): VoiceProfileView {
  return {
    userId: profile.userId,
    snapshotId: profile.snapshotId,
    version: profile.version,
    confidence: profile.confidence,
    adaptationMode: profile.adaptationMode,
    primaryLanguage: profile.primaryLanguage,
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon: [...profile.lexicon],
    constraints: [...profile.constraints],
    styleMarkers: [...profile.styleMarkers],
    rules: [...profile.rules],
    antiPatterns: [...profile.antiPatterns]
  };
}

export function toTextQualityVoiceProfile(
  profile: DerivedVoiceProfile,
  extras: {
    readonly antiPatternsExplicit?: readonly string[];
    readonly userLabels?: readonly string[];
    readonly derivedAntiPatterns?: readonly string[];
  } = {}
): TextQualityVoiceProfile {
  return {
    userId: profile.userId,
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon: [...profile.lexicon],
    constraints: [...profile.constraints],
    antiPatterns: [...profile.antiPatterns],
    antiPatternsExplicit: [...(extras.antiPatternsExplicit ?? [])],
    rules: [...profile.rules],
    styleMarkers: [...profile.styleMarkers],
    userLabels: [...(extras.userLabels ?? [])],
    ...(profile.coreReasoningSignature ? { coreReasoningSignature: profile.coreReasoningSignature } : {}),
    ...(profile.argumentDevelopmentSignature
      ? { argumentDevelopmentSignature: profile.argumentDevelopmentSignature }
      : {}),
    ...(extras.derivedAntiPatterns?.length ? { derivedAntiPatterns: [...extras.derivedAntiPatterns] } : {}),
    ...(profile.quantitativeSignals ? { quantitativeSignals: profile.quantitativeSignals } : {}),
    ...(profile.signatureOpenings?.length ? { signatureOpenings: [...profile.signatureOpenings] } : {}),
    ...(profile.signatureClosings?.length ? { signatureClosings: [...profile.signatureClosings] } : {})
  };
}
