import type { DeterministicScore, EvalExpectations } from "../types.js";

interface ToneSignals {
  readonly formal: readonly RegExp[];
  readonly informal: readonly RegExp[];
}

const TONE_SIGNALS: ToneSignals = {
  formal: [
    /\b(portanto|contudo|todavia|entretanto|outrossim|destarte|mediante|consoante|outorga|notoriamente)\b/giu,
    /\b(furthermore|moreover|consequently|hereby|thereby|notwithstanding|pursuant to)\b/giu
  ],
  informal: [
    /\b(cara|tipo|ne|pra|ta|vc|vcs|blz|show|massa|legal demais)\b/giu,
    /\b(hey|btw|lol|kinda|gotta|wanna|gonna)\b/giu
  ]
};

export function scoreDeterministic(text: string, expectations: EvalExpectations): DeterministicScore {
  const normalizedText = text.trim();
  const hasExpectations = hasAnyExpectation(expectations);

  if (!hasExpectations) {
    return {
      score: 100,
      checks: [{ name: "no-expectations", passed: true, message: "No deterministic expectations defined" }]
    };
  }

  if (normalizedText.length === 0) {
    return {
      score: 0,
      checks: [{ name: "empty-text", passed: false, message: "Candidate text is empty" }]
    };
  }

  const checks: DeterministicCheck[] = [];

  if (expectations.mustContain !== undefined) {
    checks.push(...expectations.mustContain.map((phrase) => checkMustContain(normalizedText, phrase)));
  }

  if (expectations.mustNotContain !== undefined) {
    checks.push(...expectations.mustNotContain.map((phrase) => checkMustNotContain(normalizedText, phrase)));
  }

  if (expectations.wordCountRange !== undefined) {
    checks.push(checkWordCountRange(normalizedText, expectations.wordCountRange));
  }

  if (expectations.tone !== undefined) {
    checks.push(checkTone(normalizedText, expectations.tone));
  }

  const passingChecks = checks.filter((check) => check.passed).length;
  const score = checks.length === 0 ? 100 : Math.round((passingChecks / checks.length) * 100);

  return { score, checks };
}

function hasAnyExpectation(expectations: EvalExpectations): boolean {
  return (
    expectations.mustContain !== undefined ||
    expectations.mustNotContain !== undefined ||
    expectations.wordCountRange !== undefined ||
    expectations.tone !== undefined
  );
}

function checkMustContain(text: string, phrase: string): DeterministicCheck {
  const passed = text.toLowerCase().includes(phrase.toLowerCase());
  return {
    name: `must-contain: ${phrase}`,
    passed,
    message: passed ? `Found "${phrase}"` : `Missing "${phrase}"`
  };
}

function checkMustNotContain(text: string, phrase: string): DeterministicCheck {
  const passed = !text.toLowerCase().includes(phrase.toLowerCase());
  return {
    name: `must-not-contain: ${phrase}`,
    passed,
    message: passed ? `Did not find "${phrase}"` : `Unexpectedly found "${phrase}"`
  };
}

function checkWordCountRange(
  text: string,
  range: NonNullable<EvalExpectations["wordCountRange"]>
): DeterministicCheck {
  const wordCount = countWords(text);
  const passed = wordCount >= range.min && wordCount <= range.max;
  return {
    name: "word-count-range",
    passed,
    message: passed
      ? `Word count ${wordCount} is within [${range.min}, ${range.max}]`
      : `Word count ${wordCount} is outside [${range.min}, ${range.max}]`
  };
}

function checkTone(text: string, expectedTone: NonNullable<EvalExpectations["tone"]>): DeterministicCheck {
  const detected = detectTone(text);
  const passed = detected === expectedTone;
  return {
    name: "tone",
    passed,
    message: passed
      ? `Detected tone "${detected}" matches expected "${expectedTone}"`
      : `Detected tone "${detected}" does not match expected "${expectedTone}"`
  };
}

function detectTone(text: string): "formal" | "informal" | "neutral" {
  const normalized = text.toLowerCase();
  let formalHits = 0;
  let informalHits = 0;

  for (const pattern of TONE_SIGNALS.formal) {
    formalHits += countMatches(normalized, pattern);
  }

  for (const pattern of TONE_SIGNALS.informal) {
    informalHits += countMatches(normalized, pattern);
  }

  const total = formalHits + informalHits;

  if (total === 0) {
    return "neutral";
  }

  const formalRatio = formalHits / total;
  const informalRatio = informalHits / total;

  if (formalRatio > 0.6) return "formal";
  if (informalRatio > 0.6) return "informal";
  return "neutral";
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches?.length ?? 0;
}

function countWords(text: string): number {
  return text
    .split(/\s+/u)
    .filter((token) => token.length > 0).length;
}

type DeterministicCheck = DeterministicScore["checks"][number];
