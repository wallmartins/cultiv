import type { TextQualityVoiceProfile } from "@my-ai-orchestrator/contracts";
import type { EvalCase } from "../types.js";
import type { GeneratorAdapter } from "./types.js";

export function createPlaceholderGenerator(): GeneratorAdapter {
  return {
    name: "placeholder",
    generate: async (evalCase: EvalCase, voiceProfile: TextQualityVoiceProfile | undefined) => {
      if (evalCase.suite === "voice-fidelity") {
        const briefing = evalCase.input.briefing;
        const topic = briefing.toLowerCase().replace(/^write about /, "").replace(/^write /, "");
        const targetWords = evalCase.expectations.wordCountRange?.min ?? 200;
        const authorHint = voiceProfile?.coreReasoningSignature
          ? ` It echoes the ${voiceProfile.coreReasoningSignature.certaintyLevel} cadence the author uses.`
          : "";

        const baseParagraphs = [
          `A thoughtful take on ${topic}.${authorHint}`,
          "It keeps the argument grounded and avoids easy slogans.",
          "The conclusion lands where the evidence points, not where habit expects."
        ];

        return expandToWordTarget(baseParagraphs, targetWords, topic);
      }

      return "";
    }
  };
}

function expandToWordTarget(paragraphs: readonly string[], targetWords: number, topic: string): string {
  const filler = [
    "The central claim is that this matters more than it first appears.",
    "Rather than forcing a neat answer, the piece lets the tension sit for a moment.",
    "Examples are chosen because they illuminate the pattern, not because they flatter the author.",
    "There is a quiet resistance to oversimplification throughout.",
    "The reader is invited to notice the same thing the author noticed.",
    "What looks like a detail turns out to carry the argument.",
    "The prose slows where the idea needs room, and tightens where it does not.",
    `Every paragraph returns to ${topic} without repeating the same phrase.`,
    "The voice stays consistent even when the subject shifts.",
    "In the end, the text earns its conclusion instead of announcing it."
  ];

  const expanded = [...paragraphs];
  let wordCount = countWords(expanded.join(" "));
  let fillerIndex = 0;

  while (wordCount < targetWords && fillerIndex < filler.length * 3) {
    expanded.push(filler[fillerIndex % filler.length]);
    fillerIndex += 1;
    wordCount = countWords(expanded.join(" "));
  }

  return expanded.join(" ");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}
