import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createAIAdapterRegistry, createAIAdapterService, registerDefaultAIProviders } from "@my-ai-orchestrator/ai-adapters";
import type { BackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";
import { evaluateWithVoiceJudge } from "../../apps/backend/src/execution/quality/voice-judge.js";
import { TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE } from "../../apps/backend/src/product/voice/argument-development-extraction.js";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";

const voiceProfile: VoiceProfile = {
  userId: "user-1",
  tone: "informal",
  cadence: "direct",
  lexicon: [],
  constraints: [],
  examples: ["Eu observo antes de concluir."],
  antiPatterns: [],
  antiPatternsExplicit: [],
  rules: [],
  styleMarkers: [],
  userLabels: [],
  coreReasoningSignature: {
    narrativeProse: "Observes before concluding.",
    certaintyLevel: "moderate",
    judgmentFrequency: "low",
    conclusionPace: "slow",
    readerRelationship: "peer",
    authoritySource: "personal_observation",
    derivedAntiPatterns: []
  },
  argumentDevelopmentSignature: TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development
};

const candidate: CandidateText = {
  laneId: "lane-a",
  draft: "draft",
  humanizedDraft: "humanized",
  refinedDraft: "Refined candidate with observational tone.",
  critic: { findings: [], score: 80 },
  fidelity: { passed: true, score: 80, notes: [] },
  drift: { score: 70, notes: [] },
  score: {
    criticScore: 80,
    fidelityScore: 80,
    driftScore: 70,
    strategyBonus: 0,
    finalScore: 80
  }
};

describe("voice judge development prompt", () => {
  it("includes development block in judge user prompt", async () => {
    let capturedContent = "";

    const providerTransport: BackendProviderTransport = {
      complete: (request) => {
        const body = request.body as Record<string, unknown>;
        const messages = Array.isArray(body.messages)
          ? (body.messages as ReadonlyArray<Record<string, unknown>>)
          : [];
        const userMessage = messages.find((message) => message.role === "user");
        capturedContent = typeof userMessage?.content === "string" ? userMessage.content : "";

        return Effect.succeed({
          choices: [{ message: { content: '{"score": 84, "rationale": "ok"}' }, finish_reason: "stop" }]
        });
      }
    };

    const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));

    await Effect.runPromise(
      evaluateWithVoiceJudge({
        candidate,
        voiceProfile,
        qualityMode: "strict",
        attempts: [{ provider: "groq", model: "llama-3.3-70b-versatile" }],
        aiAdapters,
        providerTransport
      })
    );

    expect(capturedContent).toContain("Argument development:");
    expect(capturedContent).toContain(TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development.developmentProse);
    expect(capturedContent).toContain(`Epistemic posture: ${TEST_ARGUMENT_DEVELOPMENT_EXTRACTION_FIXTURE.development.epistemicPosture}`);
  });
});
