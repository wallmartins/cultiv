import { describe, expect, it } from "vitest";
import {
  collectVoiceAntiPatterns,
  collectVoiceExampleTexts,
  formatVoiceExamples
} from "../../apps/backend/src/execution/skill-inputs.js";

describe("voice prompt inputs", () => {
  it("formats author examples for prompt injection", () => {
    const formatted = formatVoiceExamples([
      "Aprendi mais ouvindo colegas em um café.",
      "Escolho com critério o que merece meu tempo."
    ]);

    expect(formatted).toContain("Example 1:");
    expect(formatted).toContain("Aprendi mais ouvindo colegas em um café.");
    expect(formatted).toContain("Example 2:");
  });

  it("merges explicit anti-patterns into the voice signal list", () => {
    expect(
      collectVoiceAntiPatterns({
        antiPatterns: ["generic linkedin tone"],
        antiPatternsExplicit: ["metáforas de software fora de contexto"]
      })
    ).toEqual(["generic linkedin tone", "metáforas de software fora de contexto"]);
  });

  it("collects trimmed signature phrases from the voice profile", () => {
    expect(
      collectVoiceExampleTexts({
        signatureOpenings: ["  Primeiro exemplo.  ", ""],
        signatureClosings: ["Segundo exemplo."]
      })
    ).toEqual(["Primeiro exemplo.", "Segundo exemplo."]);
  });
});
