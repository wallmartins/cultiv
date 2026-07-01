import type { VoiceProfile } from "../types.js";

export function createVoiceProfile(userId: string, hints: Partial<VoiceProfile> = {}): VoiceProfile {
  return {
    userId,
    tone: hints.tone ?? "professional",
    cadence: hints.cadence ?? "natural",
    description: hints.description,
    lexicon: hints.lexicon ?? [],
    constraints: hints.constraints ?? [],
    antiPatterns: hints.antiPatterns ?? [],
    antiPatternsExplicit: hints.antiPatternsExplicit ?? [],
    rules: hints.rules ?? [],
    styleMarkers: hints.styleMarkers ?? [],
    userLabels: hints.userLabels ?? [],
    ...resolveOptionalFields(hints)
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
    antiPatterns: uniqueStrings([...(base.antiPatterns ?? []), ...(hints.antiPatterns ?? [])]),
    antiPatternsExplicit: uniqueStrings([
      ...(base.antiPatternsExplicit ?? []),
      ...(hints.antiPatternsExplicit ?? [])
    ]),
    rules: uniqueStrings([...(base.rules ?? []), ...(hints.rules ?? [])]),
    styleMarkers: uniqueStrings([...(base.styleMarkers ?? []), ...(hints.styleMarkers ?? [])]),
    userLabels: uniqueStrings([...(base.userLabels ?? []), ...(hints.userLabels ?? [])]),
    ...resolveOptionalFields(hints, base)
  };
}

export function buildStructuredPrompt(profile: VoiceProfile): { system: string; user: string } {
  const antiPatterns = [
    ...profile.antiPatterns,
    ...(profile.derivedAntiPatterns ?? [])
  ];

  const system = [
    "== AUTHOR VOICE ==",
    profile.coreReasoningSignature?.narrativeProse ?? "",
    "",
    "== HOW THEY DEVELOP TEXTS ==",
    profile.argumentDevelopmentSignature?.developmentProse ?? "",
    "",
    "== SIGNATURE PHRASES ==",
    `Openings: ${profile.signatureOpenings?.join("; ") ?? "none"}`,
    `Closings: ${profile.signatureClosings?.join("; ") ?? "none"}`,
    "",
    "== WRITING STYLE ==",
    `Tone: ${profile.tone}`,
    `Cadence: ${profile.cadence}`,
    `Markers: ${profile.styleMarkers.join(", ")}`,
    "",
    "== QUANTITATIVE CONSTRAINTS ==",
    `- Average sentence length: ${profile.quantitativeSignals?.aggregate.avgSentenceLength ?? "varies"} words (±15%)`,
    `- Sentence length variance: ${profile.quantitativeSignals?.aggregate.sentenceLengthVariance ?? "varies"}`,
    `- Vocabulary diversity: ${profile.quantitativeSignals?.aggregate.typeTokenRatio ?? "varies"}`,
    `- Formality level: ${profile.quantitativeSignals?.aggregate.formalityScore ?? "varies"}`,
    `- Dependency depth: ${profile.quantitativeSignals?.aggregate.avgDependencyDepth ?? "varies"}`,
    "",
    "== ANTI-PATTERNS ==",
    ...antiPatterns,
    "",
    "== STRUCTURAL RULES ==",
    ...profile.rules
  ].join("\n");

  return { system, user: "" };
}

export function formatQuantitativeConstraintsSection(profile: Partial<VoiceProfile>): string {
  const signals = profile.quantitativeSignals;
  if (!signals) {
    return "";
  }

  const aggregate = signals.aggregate;
  return [
    "== QUANTITATIVE CONSTRAINTS ==",
    `- Average sentence length: ${aggregate.avgSentenceLength} words (±15%)`,
    `- Sentence length variance: ${aggregate.sentenceLengthVariance}`,
    `- Vocabulary diversity: ${aggregate.typeTokenRatio}`,
    `- Formality level: ${aggregate.formalityScore}`,
    `- Dependency depth: ${aggregate.avgDependencyDepth}`,
    ""
  ].join("\n");
}

function resolveOptionalFields(
  hints: Partial<VoiceProfile>,
  base?: VoiceProfile
): Pick<
  VoiceProfile,
  | "coreReasoningSignature"
  | "argumentDevelopmentSignature"
  | "derivedAntiPatterns"
  | "quantitativeSignals"
  | "signatureOpenings"
  | "signatureClosings"
> {
  const coreReasoningSignature = hints.coreReasoningSignature ?? base?.coreReasoningSignature;
  const argumentDevelopmentSignature =
    hints.argumentDevelopmentSignature ?? base?.argumentDevelopmentSignature;
  const derivedAntiPatterns = hints.derivedAntiPatterns ?? base?.derivedAntiPatterns;
  const quantitativeSignals = hints.quantitativeSignals ?? base?.quantitativeSignals;
  const signatureOpenings = hints.signatureOpenings ?? base?.signatureOpenings;
  const signatureClosings = hints.signatureClosings ?? base?.signatureClosings;

  return {
    ...(coreReasoningSignature ? { coreReasoningSignature } : {}),
    ...(argumentDevelopmentSignature ? { argumentDevelopmentSignature } : {}),
    ...(derivedAntiPatterns?.length ? { derivedAntiPatterns } : {}),
    ...(quantitativeSignals ? { quantitativeSignals } : {}),
    ...(signatureOpenings?.length ? { signatureOpenings } : {}),
    ...(signatureClosings?.length ? { signatureClosings } : {})
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0)));
}
