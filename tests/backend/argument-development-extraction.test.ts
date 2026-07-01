import { Effect } from "effect";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ArgumentDevelopmentExtractionResult } from "@my-ai-orchestrator/contracts";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import {
  buildDevelopmentExtractionMessages,
  extractArgumentDevelopmentSignature
} from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import { buildReasoningExtractionMessages } from "../../apps/backend/src/product/voice/reasoning-extraction.js";
import { buildVoiceSignatureBrief } from "../../apps/backend/src/product/voice/voice-signature-brief.js";
import { createAIAdapterRegistry, createAIAdapterService, registerDefaultAIProviders } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";

interface GoldenCorpusFixture {
  readonly id: string;
  readonly examples: readonly VoiceExampleRecord[];
  readonly expected: ArgumentDevelopmentExtractionResult;
}

const goldenCorpusDir = resolve(import.meta.dirname, "../fixtures/argument-development-extraction");

function loadGoldenCorpora(): GoldenCorpusFixture[] {
  return readdirSync(goldenCorpusDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(goldenCorpusDir, file), "utf8")) as GoldenCorpusFixture);
}

function createGoldenExtractionTransport(expected: ArgumentDevelopmentExtractionResult): BackendProviderTransport {
  return {
    complete: () =>
      Effect.succeed({
        choices: [{ message: { content: JSON.stringify(expected) }, finish_reason: "stop" }]
      })
  };
}

const examples: VoiceExampleRecord[] = [
  {
    id: "ex-1",
    userId: "user-1",
    text: "Começo pela experiência vivida e só depois testo a ideia em um caso concreto.",
    language: "pt-BR",
    state: "active",
    classificationLabels: ["reasoning_reflection", "wizard_calibration"],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: ["linkedin-post"],
    topicTag: "reasoning_reflection",
    createdAt: "2026-06-17T00:00:00.000Z",
    updatedAt: "2026-06-17T00:00:00.000Z"
  },
  {
    id: "ex-2",
    userId: "user-1",
    text: "Quando ainda tenho dúvida, deixo isso explícito antes de fechar o raciocínio.",
    language: "pt-BR",
    state: "active",
    classificationLabels: ["argument_development", "wizard_calibration"],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: ["linkedin-post"],
    topicTag: "argument_development",
    createdAt: "2026-06-17T00:00:00.000Z",
    updatedAt: "2026-06-17T00:00:00.000Z"
  }
];

describe("argument development extraction prompts", () => {
  it("does not include draft core reasoning in the development prompt", () => {
    const brief = buildVoiceSignatureBrief(examples);
    const development = buildDevelopmentExtractionMessages(examples, brief);

    expect(development.user).not.toContain("Analyze the author's reasoning patterns");
    expect(development.user).not.toContain('"certaintyLevel"');
    expect(development.user).toContain("how the author develops texts");
    expect(development.user).toContain("DETERMINISTIC SIGNATURE BRIEF");
    expect(development.user).toContain("moveLabels MUST be written in Brazilian Portuguese");
    expect(development.system).toContain("moveLabels MUST be written in Brazilian Portuguese");
  });

  it.each(loadGoldenCorpora())("parses golden corpus $id", async (fixture) => {
    const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));
    const providerTransport = createGoldenExtractionTransport(fixture.expected);

    const result = await Effect.runPromise(
      extractArgumentDevelopmentSignature({
        examples: fixture.examples,
        attempts: [{ provider: "groq", model: "llama-3.3-70b-versatile" }],
        aiAdapters,
        providerTransport
      })
    );

    expect(result.development.epistemicPosture).toBe(fixture.expected.development.epistemicPosture);
    expect(result.development.moveLabels).toEqual(fixture.expected.development.moveLabels);
  });
});
