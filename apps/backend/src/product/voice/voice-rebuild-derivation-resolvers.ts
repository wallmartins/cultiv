import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { isTechLexiconTerm } from "@my-ai-orchestrator/text-quality";
import type { VoiceProfileConfidence } from "@my-ai-orchestrator/contracts";

export function resolvePrimaryLanguage(activeExamples: readonly VoiceExampleRecord[]): string {
  const languageEntries = Object.entries(countBy(activeExamples.map((example) => example.language)));
  return languageEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? "pt-BR";
}

export function resolveTone(activeExamples: readonly VoiceExampleRecord[]): string {
  const informalSignals = activeExamples.filter((example) =>
    /\b(eu|minha|minhas|meu|meus|voce|voces|vc|vcs)\b/i.test(normalizeText(example.text))
  ).length;
  return informalSignals >= Math.max(1, Math.ceil(activeExamples.length / 2)) ? "informal" : "formal";
}

export function resolveCadence(activeExamples: readonly VoiceExampleRecord[]): string {
  const averageWordsPerSentence = average(
    activeExamples.map((example) => {
      const words = tokenize(example.text);
      const sentenceCount = Math.max(1, example.text.split(/[.!?]+/).filter(Boolean).length);
      return words.length / sentenceCount;
    })
  );

  return averageWordsPerSentence <= 16 ? "direct" : averageWordsPerSentence <= 24 ? "balanced" : "measured";
}

export function resolveLexicon(activeExamples: readonly VoiceExampleRecord[]): readonly string[] {
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

export function resolveStyleMarkers(activeExamples: readonly VoiceExampleRecord[]): readonly string[] {
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

export function resolveRules(
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

export function resolveAntiPatterns(activeExamples: readonly VoiceExampleRecord[]): readonly string[] {
  return unique(activeExamples.flatMap((example) => example.antiPatternsExplicit));
}

export function calculateDiversityScore(activeExamples: readonly VoiceExampleRecord[]): number {
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

export function detectLanguageConflict(activeExamples: readonly VoiceExampleRecord[]): boolean {
  const languages = new Set(activeExamples.map((example) => example.language));
  return languages.size > 1;
}

export function countBy(values: readonly string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function tokenize(text: string): readonly string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
