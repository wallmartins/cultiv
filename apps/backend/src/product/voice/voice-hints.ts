import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type {
  CoreReasoningSignature,
  FormatExpressionProfile,
  VoiceAdaptationMode,
  VoiceProfileConfidence
} from "@my-ai-orchestrator/contracts";
import type { DomainProfile, VoiceProfile } from "@my-ai-orchestrator/text-quality";
import { filterTechLexiconTerms, isTechLexiconTerm } from "@my-ai-orchestrator/text-quality";
import { normalizeLanguage, unique } from "./voice-utils.js";
import { resolveContentTypeVoicePreset } from "./voice-presets.js";

export function buildVoiceHints(
  profile: {
    readonly tone: string;
    readonly cadence: string;
    readonly description?: string;
    readonly lexicon: readonly string[];
    readonly constraints: readonly string[];
    readonly antiPatterns: readonly string[];
    readonly rules: readonly string[];
    readonly styleMarkers: readonly string[];
    readonly primaryLanguage: string;
    readonly coreReasoningSignature?: CoreReasoningSignature;
    readonly formatExpressionProfiles?: Readonly<Record<string, FormatExpressionProfile>>;
  },
  matchingExamples: readonly VoiceExampleRecord[],
  pinnedMatchingExamples: readonly VoiceExampleRecord[],
  context: {
    readonly contentType: string;
    readonly requestedLanguage?: string;
  },
  confidence: VoiceProfileConfidence,
  adaptationMode: VoiceAdaptationMode,
  domainProfile?: DomainProfile,
  options?: { readonly reasoningSignatureEnabled?: boolean }
): Partial<VoiceProfile> {
  const preset = resolveContentTypeVoicePreset(context.contentType);
  const reasoningSignatureEnabled = options?.reasoningSignatureEnabled === true;
  const languageMismatch =
    typeof context.requestedLanguage === "string"
    && context.requestedLanguage.trim().length > 0
    && normalizeLanguage(context.requestedLanguage) !== normalizeLanguage(profile.primaryLanguage);

  const styleMarkers = unique([
    ...profile.styleMarkers.slice(0, confidence === "low" ? 3 : 6),
    ...pinnedMatchingExamples.flatMap((example) => deriveExampleStyleMarkers(example.text)).slice(0, 2)
  ]);
  const rules = unique([
    ...profile.rules.slice(0, confidence === "low" ? 3 : 6),
    ...(languageMismatch ? ["preserve_target_language"] : [])
  ]);
  const derivedAntiPatterns = reasoningSignatureEnabled
    ? (profile.coreReasoningSignature?.derivedAntiPatterns ?? [])
    : [];
  const antiPatterns = unique([
    ...profile.antiPatterns.slice(0, confidence === "low" ? 3 : 6),
    ...derivedAntiPatterns,
    ...(domainProfile?.domain === "non-technical" ? ["forced tech metaphors unrelated to the topic"] : []),
    ...(languageMismatch ? ["language drift"] : [])
  ]);
  const explicitFromExamples = unique(
    matchingExamples.flatMap((example) => example.antiPatternsExplicit ?? [])
  );
  const antiPatternsExplicit = explicitFromExamples;
  const examples = unique([
    ...pinnedMatchingExamples.map((example) => example.text.trim()),
    ...matchingExamples.filter((example) => !example.pinned).map((example) => example.text.trim())
  ]).slice(0, confidence === "low" ? 3 : 6);

  const profileLexicon = unique(profile.lexicon);
  const lexicon = filterLexiconForDomain(
    unique([
      ...profileLexicon.slice(0, confidence === "low" ? 4 : 8),
      ...extractLexicon(matchingExamples, confidence === "low" ? 6 : 12)
    ]).slice(0, confidence === "low" ? 4 : 8),
    domainProfile
  );

  const userLabels = unique(
    matchingExamples.flatMap((example) => example.classificationLabels ?? [])
  );

  const formatExpressionProfile = profile.formatExpressionProfiles?.[context.contentType];

  return {
    tone: profile.tone,
    cadence: profile.cadence,
    description: profile.description,
    lexicon,
    constraints: unique([
      ...profile.constraints,
      ...preset.constraints,
      ...(confidence === "low" || adaptationMode === "conservative" ? ["prefer_conservative_voice_adaptation"] : []),
      ...(languageMismatch ? ["preserve_target_language"] : [])
    ]),
    examples,
    antiPatterns,
    antiPatternsExplicit,
    rules,
    styleMarkers,
    userLabels,
    ...(reasoningSignatureEnabled && profile.coreReasoningSignature
      ? {
          coreReasoningSignature: profile.coreReasoningSignature,
          formatExpressionProfile,
          derivedAntiPatterns: derivedAntiPatterns
        }
      : {})
  };
}

export function filterLexiconForDomain(
  lexicon: readonly string[],
  domainProfile?: DomainProfile
): readonly string[] {
  if (!domainProfile || domainProfile.allowTechnicalLexicon) {
    return lexicon;
  }

  return filterTechLexiconTerms(lexicon);
}

export function selectExamplesForContentType(
  examples: readonly VoiceExampleRecord[],
  contentType: string
): VoiceExampleRecord[] {
  return [...examples]
    .filter((example) => {
      if (example.explicitContentType === contentType) {
        return true;
      }

      return (example.effectiveContentTypeHints ?? []).includes(contentType);
    })
    .sort((left, right) => {
      const pinnedRank = Number(right.pinned) - Number(left.pinned);
      if (pinnedRank !== 0) {
        return pinnedRank;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
}

export function deriveExampleStyleMarkers(text: string): readonly string[] {
  const normalized = text.toLowerCase();
  const markers: string[] = [];

  if (normalized.includes("\n\n")) {
    markers.push("short paragraphs");
  }

  if (/\b(eu|minha|minhas|meu|meus)\b/i.test(text)) {
    markers.push("first-person narrative");
  }

  if (text.length < 180) {
    markers.push("direct opening");
  }

  return markers;
}

const LEXICON_STOPWORDS = new Set([
  "para",
  "com",
  "uma",
  "como",
  "mais",
  "isso",
  "essa",
  "esse",
  "sobre",
  "quando",
  "muito",
  "pouco",
  "entre",
  "depois",
  "antes",
  "insight",
  "concrete",
  "observation",
  "claro",
  "concreto",
  "específico",
  "especifico"
]);

export function extractLexicon(examples: readonly VoiceExampleRecord[], limit: number): readonly string[] {
  const frequencies = new Map<string, number>();

  for (const token of examples.flatMap((example) =>
    example.text
      .toLowerCase()
      .split(/[^\p{L}0-9]+/u)
      .map((value) => value.trim())
      .filter((value) => value.length > 4 && !LEXICON_STOPWORDS.has(value) && !isTechLexiconTerm(value))
  )) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, Math.max(1, limit))
    .map(([token]) => token);
}
