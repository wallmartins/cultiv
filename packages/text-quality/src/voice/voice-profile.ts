import type { VoiceProfile } from "../types.js";

export function createVoiceProfile(userId: string, hints: Partial<VoiceProfile> = {}): VoiceProfile {
  return {
    userId,
    tone: hints.tone ?? "professional",
    cadence: hints.cadence ?? "natural",
    description: hints.description,
    lexicon: hints.lexicon ?? [],
    constraints: hints.constraints ?? [],
    examples: hints.examples ?? [],
    antiPatterns: hints.antiPatterns ?? [],
    antiPatternsExplicit: hints.antiPatternsExplicit ?? [],
    rules: hints.rules ?? [],
    styleMarkers: hints.styleMarkers ?? [],
    userLabels: hints.userLabels ?? [],
    ...resolveReasoningFields(hints)
  };
}

export function mergeVoiceProfile(base: VoiceProfile, hints: Partial<VoiceProfile>): VoiceProfile {
  return {
    userId: base.userId,
    tone: hints.tone ?? base.tone,
    cadence: hints.cadence ?? base.cadence,
    description: hints.description ?? base.description,
    lexicon: uniqueStrings([...(base.lexicon ?? []), ...(hints.lexicon ?? [])]),
    constraints: uniqueStrings([...(base.constraints ?? []), ...(hints.constraints ?? [])]),
    examples: uniqueStrings([...(base.examples ?? []), ...(hints.examples ?? [])]),
    antiPatterns: uniqueStrings([...(base.antiPatterns ?? []), ...(hints.antiPatterns ?? [])]),
    antiPatternsExplicit: uniqueStrings([...(base.antiPatternsExplicit ?? []), ...(hints.antiPatternsExplicit ?? [])]),
    rules: uniqueStrings([...(base.rules ?? []), ...(hints.rules ?? [])]),
    styleMarkers: uniqueStrings([...(base.styleMarkers ?? []), ...(hints.styleMarkers ?? [])]),
    userLabels: uniqueStrings([...(base.userLabels ?? []), ...(hints.userLabels ?? [])]),
    ...resolveReasoningFields(hints, base)
  };
}

function resolveReasoningFields(
  hints: Partial<VoiceProfile>,
  base?: VoiceProfile
): Pick<
  VoiceProfile,
  | "coreReasoningSignature"
  | "argumentDevelopmentSignature"
  | "formatExpressionProfile"
  | "derivedAntiPatterns"
> {
  const coreReasoningSignature = hints.coreReasoningSignature ?? base?.coreReasoningSignature;
  const argumentDevelopmentSignature =
    hints.argumentDevelopmentSignature ?? base?.argumentDevelopmentSignature;
  const formatExpressionProfile = hints.formatExpressionProfile ?? base?.formatExpressionProfile;
  const derivedAntiPatterns = hints.derivedAntiPatterns ?? base?.derivedAntiPatterns;

  return {
    ...(coreReasoningSignature ? { coreReasoningSignature } : {}),
    ...(argumentDevelopmentSignature ? { argumentDevelopmentSignature } : {}),
    ...(formatExpressionProfile ? { formatExpressionProfile } : {}),
    ...(derivedAntiPatterns?.length ? { derivedAntiPatterns } : {})
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0)));
}
