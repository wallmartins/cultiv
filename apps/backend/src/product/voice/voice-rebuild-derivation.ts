import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { isTechLexiconTerm } from "@my-ai-orchestrator/text-quality";
import type { ReasonCode, ReasoningExtractionResult, VoiceProfileConfidence } from "@my-ai-orchestrator/contracts";
import {
  nextActionCodesForReason,
  type DerivedVoiceProfile,
  type VoiceCoverageItem,
  type VoiceProfileDiagnostics
} from "@my-ai-orchestrator/domain";

export interface VoiceRebuildDerivation {
  readonly profile: DerivedVoiceProfile;
  readonly diagnostics: VoiceProfileDiagnostics;
}

export function deriveVoiceRebuildState(args: {
  readonly userId: string;
  readonly version: number;
  readonly timestamp: string;
  readonly allExamples: readonly VoiceExampleRecord[];
  readonly previousProfile?: DerivedVoiceProfile;
  readonly reasoning?: ReasoningExtractionResult;
  readonly reasoningExtractionFailed?: boolean;
}): VoiceRebuildDerivation {
  const activeExamples = args.allExamples.filter((example) => example.state === "active");
  const materialBase = buildVoiceMaterialBase(args.allExamples);
  const confidence = deriveConfidence(activeExamples);
  const reasonCodes = [...deriveReasonCodes(activeExamples)];
  if (args.reasoningExtractionFailed) {
    reasonCodes.push("reasoning_extraction_failed");
  }
  const nextActionCodes = unique(
    reasonCodes.flatMap((reasonCode) => nextActionCodesForReason(reasonCode))
  );
  const coverage = deriveCoverage(activeExamples);

  const profile: DerivedVoiceProfile = {
    id: `voice-profile:${args.userId}`,
    userId: args.userId,
    version: args.version,
    snapshotId: `voice-profile-snapshot:${args.userId}:v${args.version}`,
    confidence,
    adaptationMode: confidence === "low" ? "conservative" : "standard",
    primaryLanguage: resolvePrimaryLanguage(activeExamples),
    tone: resolveTone(activeExamples),
    cadence: resolveCadence(activeExamples),
    description: buildProfileDescription(activeExamples, confidence),
    lexicon: resolveLexicon(activeExamples),
    constraints: confidence === "low" ? ["avoid_voice_caricature"] : ["preserve_author_voice"],
    styleMarkers: resolveStyleMarkers(activeExamples),
    rules: resolveRules(activeExamples, confidence),
    antiPatterns: resolveAntiPatterns(activeExamples),
    coreReasoningSignature:
      args.reasoning?.core ?? args.previousProfile?.coreReasoningSignature,
    formatExpressionProfiles:
      args.reasoning?.formatExpressions ?? args.previousProfile?.formatExpressionProfiles,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };

  const diagnostics: VoiceProfileDiagnostics = {
    id: `voice-diagnostics:${args.userId}`,
    userId: args.userId,
    activeVersion: args.version,
    updating: false,
    summary: buildDiagnosticsSummary(confidence, reasonCodes, coverage.bestCovered.length),
    reasonCodes,
    nextActionCodes,
    bestCoveredContentTypes: coverage.bestCovered,
    underrepresentedContentTypes: coverage.underrepresented,
    pendingRebuild: args.reasoningExtractionFailed
      ? {
          status: "failed",
          reasonCode: "reasoning_extraction_failed",
          nextActionCodes: nextActionCodesForReason("reasoning_extraction_failed")
        }
      : {
          status: "idle",
          nextActionCodes: []
        },
    materialBase,
    createdAt: args.timestamp,
    updatedAt: args.timestamp
  };

  return {
    profile,
    diagnostics
  };
}

export function buildVoiceMaterialBase(examples: readonly VoiceExampleRecord[]) {
  const activeExamples = examples.filter((example) => example.state === "active");
  const byClassification = countBy(
    examples.flatMap((example) => example.classificationLabels.length > 0 ? example.classificationLabels : ["unclassified"])
  );
  const byContentType = countBy(
    activeExamples.flatMap((example) =>
      example.explicitContentType
        ? [example.explicitContentType]
        : example.effectiveContentTypeHints.length > 0
          ? [...example.effectiveContentTypeHints]
          : ["general"]
    )
  );
  const byLanguage = countBy(examples.map((example) => example.language));

  return {
    totalExamples: examples.length,
    activeExamples: activeExamples.length,
    excludedExamples: examples.filter((example) => example.state === "excluded").length,
    pinnedExamples: activeExamples.filter((example) => example.pinned).length,
    byClassification,
    byContentType,
    byLanguage
  };
}

export function resolveNextProfileVersion(
  currentProfile?: { readonly profileVersion: number },
  currentDiagnostics?: { readonly activeVersion: number; readonly pendingVersion?: number }
): number {
  const activeVersion = currentProfile?.profileVersion ?? currentDiagnostics?.activeVersion ?? 0;
  return Math.max(activeVersion + 1, currentDiagnostics?.pendingVersion ?? 0);
}

function deriveConfidence(activeExamples: readonly VoiceExampleRecord[]): VoiceProfileConfidence {
  if (activeExamples.length < 5) {
    return "low";
  }

  const diversityScore = calculateDiversityScore(activeExamples);
  if (diversityScore < 4) {
    return "medium";
  }

  return "high";
}

function deriveReasonCodes(activeExamples: readonly VoiceExampleRecord[]): readonly ReasonCode[] {
  const reasonCodes: ReasonCode[] = [];
  const diversityScore = calculateDiversityScore(activeExamples);

  if (activeExamples.length < 5) {
    reasonCodes.push("insufficient_examples");
  }

  if (activeExamples.length >= 5 && diversityScore < 4) {
    reasonCodes.push("insufficient_diversity");
  }

  if (detectLanguageConflict(activeExamples)) {
    reasonCodes.push("language_conflict");
  }

  return reasonCodes;
}

function deriveCoverage(activeExamples: readonly VoiceExampleRecord[]) {
  const counts = countBy(
    activeExamples.flatMap((example) =>
      example.explicitContentType
        ? [example.explicitContentType]
        : example.effectiveContentTypeHints.length > 0
          ? [...example.effectiveContentTypeHints]
          : ["general"]
    )
  );

  const items = Object.entries(counts).map(([contentType, total]) => {
    const coverage = total >= 3 ? "high" : total >= 2 ? "medium" : "low";
    const reasonCodes: ReasonCode[] = [];

    if (total < 2) {
      reasonCodes.push("insufficient_examples");
    }

    if (coverage === "low") {
      reasonCodes.push("insufficient_diversity");
    }

    return {
      contentType,
      coverage,
      reasonCodes: unique(reasonCodes)
    } satisfies VoiceCoverageItem;
  });

  return {
    bestCovered: items.filter((item) => item.coverage !== "low"),
    underrepresented: items.filter((item) => item.coverage === "low")
  };
}

function buildDiagnosticsSummary(
  confidence: VoiceProfileConfidence,
  reasonCodes: readonly ReasonCode[],
  wellCoveredContentTypes: number
): string {
  if (reasonCodes.includes("reasoning_extraction_failed")) {
    return "Não foi possível atualizar o raciocínio inferido agora. O último snapshot válido continua ativo.";
  }

  if (reasonCodes.includes("insufficient_examples")) {
    return "Ainda faltam exemplos suficientes para consolidar uma voz forte e previsível.";
  }

  if (reasonCodes.includes("language_conflict")) {
    return "A voz já tem base razoável, mas os exemplos misturam idiomas e isso reduz a consistência.";
  }

  if (reasonCodes.includes("insufficient_diversity")) {
    return "Já existe base suficiente, mas ainda falta diversidade de formatos e contextos para estabilizar a voz.";
  }

  if (confidence === "high" && wellCoveredContentTypes > 1) {
    return "A voz do autor está bem representada e cobre bem mais de um tipo de conteúdo.";
  }

  if (confidence === "high") {
    return "A voz do autor está bem representada e pronta para adaptações mais firmes.";
  }

  return "O profile atual já está utilizável, mas ainda pode ficar mais representativo.";
}

function buildProfileDescription(
  activeExamples: readonly VoiceExampleRecord[],
  confidence: VoiceProfileConfidence
): string {
  const tone = resolveTone(activeExamples);
  const cadence = resolveCadence(activeExamples);

  if (confidence === "low") {
    return `Voz ${tone} com cadência ${cadence}, ainda em consolidação.`;
  }

  return `Voz ${tone} com cadência ${cadence} e sinais consistentes entre os exemplos.`;
}

function resolvePrimaryLanguage(activeExamples: readonly VoiceExampleRecord[]): string {
  const languageEntries = Object.entries(countBy(activeExamples.map((example) => example.language)));
  return languageEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "pt-BR";
}

function resolveTone(activeExamples: readonly VoiceExampleRecord[]): string {
  const informalSignals = activeExamples.filter((example) =>
    /\b(eu|minha|minhas|meu|meus|voce|voces|vc|vcs)\b/i.test(normalizeText(example.text))
  ).length;
  return informalSignals >= Math.max(1, Math.ceil(activeExamples.length / 2)) ? "informal" : "formal";
}

function resolveCadence(activeExamples: readonly VoiceExampleRecord[]): string {
  const averageWordsPerSentence = average(
    activeExamples.map((example) => {
      const words = tokenize(example.text);
      const sentenceCount = Math.max(1, example.text.split(/[.!?]+/).filter(Boolean).length);
      return words.length / sentenceCount;
    })
  );

  return averageWordsPerSentence <= 16 ? "direct" : averageWordsPerSentence <= 24 ? "balanced" : "measured";
}

function resolveLexicon(activeExamples: readonly VoiceExampleRecord[]): readonly string[] {
  const stopWords = new Set([
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
    "antes"
  ]);

  const frequencies = new Map<string, number>();
  for (const token of activeExamples.flatMap((example) => tokenize(example.text))) {
    if (token.length < 5 || stopWords.has(token) || isTechLexiconTerm(token)) {
      continue;
    }

    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([token]) => token);
}

function resolveStyleMarkers(activeExamples: readonly VoiceExampleRecord[]): readonly string[] {
  const markers = new Set<string>();

  if (activeExamples.some((example) => /\b(eu|minha|minhas|meu|meus)\b/i.test(normalizeText(example.text)))) {
    markers.add("first-person");
  }

  if (average(activeExamples.map((example) => tokenize(example.text).length)) < 30) {
    markers.add("short-paragraphs");
  }

  if (activeExamples.some((example) => /\b(voce|voces|vc|vcs)\b/i.test(normalizeText(example.text)))) {
    markers.add("direct-address");
  }

  if (activeExamples.some((example) => example.pinned)) {
    markers.add("author-selected-reference");
  }

  return [...markers];
}

function resolveRules(
  activeExamples: readonly VoiceExampleRecord[],
  confidence: VoiceProfileConfidence
): readonly string[] {
  const rules = new Set<string>();

  if (activeExamples.some((example) => /\b(eu|minha|minhas|meu|meus)\b/i.test(normalizeText(example.text)))) {
    rules.add("prefer_first_person_when_relevant");
  }

  if (confidence === "low") {
    rules.add("prefer_conservative_voice_adaptation");
  }

  if (average(activeExamples.map((example) => tokenize(example.text).length)) < 30) {
    rules.add("prefer_shorter_paragraphs");
  }

  if (detectLanguageConflict(activeExamples)) {
    rules.add("avoid_mixing_languages_without_context");
  }

  return [...rules];
}

function resolveAntiPatterns(activeExamples: readonly VoiceExampleRecord[]): readonly string[] {
  return unique(activeExamples.flatMap((example) => example.antiPatternsExplicit));
}

function calculateDiversityScore(activeExamples: readonly VoiceExampleRecord[]): number {
  const contentTypes = new Set(
    activeExamples.flatMap((example) =>
      example.explicitContentType
        ? [example.explicitContentType]
        : example.effectiveContentTypeHints.length > 0
          ? [...example.effectiveContentTypeHints]
          : ["general"]
    )
  );
  const channels = new Set(activeExamples.map((example) => example.channel).filter(Boolean));
  const formats = new Set(activeExamples.map((example) => example.format).filter(Boolean));
  const lengthBuckets = new Set(
    activeExamples.map((example) => {
      const length = tokenize(example.text).length;
      if (length < 18) {
        return "short";
      }
      if (length < 40) {
        return "medium";
      }
      return "long";
    })
  );

  return contentTypes.size + channels.size + formats.size + lengthBuckets.size - 1;
}

function detectLanguageConflict(activeExamples: readonly VoiceExampleRecord[]): boolean {
  const languages = new Set(activeExamples.map((example) => example.language));
  return languages.size > 1;
}

function countBy(values: readonly string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function tokenize(text: string): readonly string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
