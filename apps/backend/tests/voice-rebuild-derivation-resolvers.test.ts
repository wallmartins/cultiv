import { describe, expect, it } from "vitest";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  calculateDiversityScore,
  normalizeText,
  tokenize
} from "../src/product/voice/voice-rebuild-derivation-resolvers.js";

describe("voice rebuild derivation resolvers", () => {
  it("normalizeText lowercases and strips diacritics", () => {
    expect(normalizeText("Ação rápida")).toBe("acao rapida");
  });

  it("tokenize splits normalized text on non-alphanumeric boundaries", () => {
    expect(tokenize("Olá, mundo!")).toEqual(["ola", "mundo"]);
  });

  it("calculateDiversityScore counts content, channel, format, and length variety", () => {
    const examples: VoiceExampleRecord[] = [
      {
        state: "active",
        language: "pt-BR",
        text: "Primeiro exemplo curto.",
        explicitContentType: "blog",
        channel: "newsletter",
        format: "essay",
        effectiveContentTypeHints: [],
        antiPatternsExplicit: []
      } as VoiceExampleRecord,
      {
        state: "active",
        language: "pt-BR",
        text: "Segundo exemplo com mais palavras para mudar o bucket de comprimento e garantir variedade suficiente no tamanho do texto.",
        explicitContentType: "social",
        channel: "linkedin",
        format: "thread",
        effectiveContentTypeHints: [],
        antiPatternsExplicit: []
      } as VoiceExampleRecord
    ];

    expect(calculateDiversityScore(examples)).toBe(7);
  });
});
