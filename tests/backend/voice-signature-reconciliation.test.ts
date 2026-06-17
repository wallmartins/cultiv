import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createAIAdapterRegistry, createAIAdapterService, registerDefaultAIProviders } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";
import { reconcileVoiceSignatures } from "../../apps/backend/src/product/voice/voice-signature-reconciliation.js";
import {
  TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE,
  TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT
} from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import {
  TEST_REASONING_EXTRACTION_FIXTURE,
  TEST_REASONING_EXTRACTION_FIXTURE_PT
} from "../../apps/backend/src/product/voice/reasoning-extraction.js";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";

const examples: VoiceExampleRecord[] = [
  {
    id: "ex-1",
    userId: "user-1",
    text: "Exemplo ativo um.",
    language: "pt-BR",
    state: "active",
    classificationLabels: [],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: ["linkedin-post"],
    createdAt: "2026-06-17T00:00:00.000Z",
    updatedAt: "2026-06-17T00:00:00.000Z"
  },
  {
    id: "ex-2",
    userId: "user-1",
    text: "Exemplo ativo dois.",
    language: "pt-BR",
    state: "active",
    classificationLabels: [],
    antiPatternsExplicit: [],
    pinned: false,
    pendingProfileImpact: false,
    effectiveContentTypeHints: ["linkedin-post"],
    createdAt: "2026-06-17T00:00:00.000Z",
    updatedAt: "2026-06-17T00:00:00.000Z"
  }
];

function createReconciliationTransport(response: string): BackendProviderTransport {
  return {
    complete: () =>
      Effect.succeed({
        choices: [{ message: { content: response }, finish_reason: "stop" }]
      })
  };
}

describe("voice signature reconciliation", () => {
  const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));

  it("parses reconciled unified signature from valid JSON", async () => {
    const response = JSON.stringify({
      core: TEST_REASONING_EXTRACTION_FIXTURE_PT.core,
      development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE_PT.development,
      formatExpressions: TEST_REASONING_EXTRACTION_FIXTURE_PT.formatExpressions
    });

    const result = await Effect.runPromise(
      reconcileVoiceSignatures({
        examples,
        reasoning: TEST_REASONING_EXTRACTION_FIXTURE,
        development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
        attempts: [{ provider: "groq", model: "llama-3.3-70b-versatile" }],
        aiAdapters,
        providerTransport: createReconciliationTransport(response)
      })
    );

    expect(result.development.epistemicPosture).toBe("exploratory");
    expect(result.core.certaintyLevel).toBe(TEST_REASONING_EXTRACTION_FIXTURE_PT.core.certaintyLevel);
  });

  it("fails when reconciliation response is invalid JSON", async () => {
    const result = await Effect.runPromise(
      reconcileVoiceSignatures({
        examples,
        reasoning: TEST_REASONING_EXTRACTION_FIXTURE,
        development: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development,
        attempts: [{ provider: "groq", model: "llama-3.3-70b-versatile" }],
        aiAdapters,
        providerTransport: createReconciliationTransport("not-json")
      }).pipe(Effect.either)
    );

    expect(result._tag).toBe("Left");
  });
});
