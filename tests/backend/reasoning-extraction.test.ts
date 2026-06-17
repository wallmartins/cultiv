import { Effect } from "effect";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ReasoningExtractionResult } from "@my-ai-orchestrator/contracts";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import { TEST_REASONING_EXTRACTION_FIXTURE, extractReasoningSignature } from "../../apps/backend/src/product/voice/reasoning-extraction.js";
import { createAIAdapterRegistry, createAIAdapterService, registerDefaultAIProviders } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";

interface GoldenCorpusFixture {
  readonly id: string;
  readonly examples: readonly VoiceExampleRecord[];
  readonly expected: ReasoningExtractionResult;
}

const goldenCorpusDir = resolve(import.meta.dirname, "../fixtures/reasoning-extraction");

function loadGoldenCorpora(): GoldenCorpusFixture[] {
  return readdirSync(goldenCorpusDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(goldenCorpusDir, file), "utf8")) as GoldenCorpusFixture);
}

function createGoldenExtractionTransport(expected: ReasoningExtractionResult): BackendProviderTransport {
  return {
    complete: () =>
      Effect.succeed({
        choices: [
          {
            message: {
              content: JSON.stringify(expected)
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          promptTokens: 32,
          completionTokens: 48,
          totalTokens: 80
        }
      })
  };
}

describe("reasoning extraction", () => {
  it("parses schema-valid extraction from test transport", async () => {
    const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));
    const providerTransport = createGoldenExtractionTransport(TEST_REASONING_EXTRACTION_FIXTURE);

    const result = await Effect.runPromise(
      extractReasoningSignature({
        examples: [
          {
            id: "ex-1",
            userId: "user-1",
            text: "Eu começo observando o contexto antes de tirar conclusões.",
            language: "pt-BR",
            state: "active",
            classificationLabels: [],
            antiPatternsExplicit: [],
            pinned: false,
            pendingProfileImpact: false,
            effectiveContentTypeHints: ["linkedin-post"],
            evaluation: {
              systemWeight: 1,
              attentionLevel: "medium",
              attentionReasonCodes: [],
              contributionCode: "useful_for_linkedin",
              contributionPreview: "",
              userPinned: false
            },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            version: 1,
            explicitContentType: "linkedin-post"
          },
          {
            id: "ex-2",
            userId: "user-1",
            text: "Outro exemplo no mesmo formato com tom parecido.",
            language: "pt-BR",
            state: "active",
            classificationLabels: [],
            antiPatternsExplicit: [],
            pinned: false,
            pendingProfileImpact: false,
            effectiveContentTypeHints: ["linkedin-post"],
            evaluation: {
              systemWeight: 1,
              attentionLevel: "medium",
              attentionReasonCodes: [],
              contributionCode: "useful_for_linkedin",
              contributionPreview: "",
              userPinned: false
            },
            createdAt: "2026-01-02T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            version: 1,
            explicitContentType: "linkedin-post"
          }
        ],
        attempts: [{ provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 5000 }],
        aiAdapters,
        providerTransport
      })
    );

    expect(result.core.certaintyLevel).toBe(TEST_REASONING_EXTRACTION_FIXTURE.core.certaintyLevel);
    expect(result.formatExpressions["linkedin-post"]).toBeDefined();
  });

  it.each(loadGoldenCorpora())("produces schema-valid extraction for $id", async (corpus) => {
    const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));
    const providerTransport = createGoldenExtractionTransport(corpus.expected);

    const result = await Effect.runPromise(
      extractReasoningSignature({
        examples: corpus.examples,
        attempts: [{ provider: "gemini", model: "gemini-3.1-flash-lite", timeoutMs: 5000 }],
        aiAdapters,
        providerTransport
      })
    );

    expect(result.core.certaintyLevel).toBe(corpus.expected.core.certaintyLevel);
    expect(result.core.conclusionPace).toBe(corpus.expected.core.conclusionPace);
    expect(Object.keys(result.formatExpressions).length).toBeGreaterThan(0);
  });
});
