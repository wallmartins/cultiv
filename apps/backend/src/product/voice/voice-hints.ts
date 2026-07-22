import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type {
  ArgumentDevelopmentSignature,
  CoreReasoningSignature,
  GenerationChannel,
  VoiceAdaptationMode,
  VoiceProfileConfidence
} from "@my-ai-orchestrator/contracts";
import type { VoiceProfile } from "@my-ai-orchestrator/text-quality";
import { normalizeLanguage, unique } from "./voice-utils.js";
import { resolveChannelVoicePreset } from "./voice-presets.js";

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
    readonly argumentDevelopmentSignature?: ArgumentDevelopmentSignature;
    readonly quantitativeSignals?: VoiceProfile["quantitativeSignals"];
    readonly signatureOpenings?: readonly string[];
    readonly signatureClosings?: readonly string[];
  },
  matchingExamples: readonly VoiceExampleRecord[],
  pinnedMatchingExamples: readonly VoiceExampleRecord[],
  context: {
    readonly channel: GenerationChannel;
    readonly requestedLanguage?: string;
  },
  confidence: VoiceProfileConfidence,
  adaptationMode: VoiceAdaptationMode,
  options?: { readonly reasoningSignatureEnabled?: boolean }
): Partial<VoiceProfile> {
  const preset = resolveChannelVoicePreset(context.channel);
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
    ...(languageMismatch ? ["language drift"] : [])
  ]);
  const explicitFromExamples = unique(
    matchingExamples.flatMap((example) => example.antiPatternsExplicit ?? [])
  );
  const antiPatternsExplicit = explicitFromExamples;

  const profileLexicon = unique(profile.lexicon);
  const lexicon = unique([
    ...profileLexicon.slice(0, confidence === "low" ? 4 : 8),
    ...extractLexicon(matchingExamples, confidence === "low" ? 6 : 12)
  ]).slice(0, confidence === "low" ? 4 : 8);

  const userLabels = unique(
    matchingExamples.flatMap((example) => example.classificationLabels ?? [])
  );

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
    antiPatterns,
    antiPatternsExplicit,
    rules,
    styleMarkers,
    userLabels,
    ...(profile.quantitativeSignals ? { quantitativeSignals: profile.quantitativeSignals } : {}),
    ...(profile.signatureOpenings?.length ? { signatureOpenings: [...profile.signatureOpenings] } : {}),
    ...(profile.signatureClosings?.length ? { signatureClosings: [...profile.signatureClosings] } : {}),
    ...(reasoningSignatureEnabled && profile.coreReasoningSignature
      ? {
          coreReasoningSignature: profile.coreReasoningSignature,
          derivedAntiPatterns: derivedAntiPatterns,
          ...(profile.argumentDevelopmentSignature
            ? { argumentDevelopmentSignature: profile.argumentDevelopmentSignature }
            : {})
        }
      : {})
  };
}

// A voice example's Content Type maps to the channel it reads on. The FEP (ADR 0010 F6-4) narrows
// examples by channel, not by the retired Content Type. Unknown types → "unspecified" (never a
// specific-channel match). Length format aliases collapse onto the same channel bucket.
const CHANNEL_BY_CONTENT_TYPE: Record<string, GenerationChannel> = {
  "linkedin-post": "professional-network",
  "twitter-thread": "social",
  newsletter: "email",
  blog: "blog",
  "long-form-blog": "blog",
  "validation-post": "professional-network",
  "architecture-post": "professional-network"
};

function channelForContentType(contentType: string | undefined): GenerationChannel {
  return (contentType ? CHANNEL_BY_CONTENT_TYPE[contentType] : undefined) ?? "unspecified";
}

function exampleServesChannel(example: VoiceExampleRecord, channel: GenerationChannel): boolean {
  if (channelForContentType(example.explicitContentType) === channel) {
    return true;
  }

  return (example.effectiveContentTypeHints ?? []).some(
    (hint) => channelForContentType(hint) === channel
  );
}

export function selectExamplesForChannel(
  examples: readonly VoiceExampleRecord[],
  channel: GenerationChannel
): VoiceExampleRecord[] {
  // `unspecified` = the author picked no channel, so don't narrow — the whole voice is in scope.
  const scoped =
    channel === "unspecified"
      ? [...examples]
      : examples.filter((example) => exampleServesChannel(example, channel));

  return scoped.sort((left, right) => {
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
      .filter((value) => value.length > 4 && !LEXICON_STOPWORDS.has(value))
  )) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, Math.max(1, limit))
    .map(([token]) => token);
}
