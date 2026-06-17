import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { createAIAdapterRegistry, createAIAdapterService, registerDefaultAIProviders } from "@my-ai-orchestrator/ai-adapters";
import { createBackendObservabilityService } from "../../apps/backend/src/product/core/observability.js";
import { createBackendProviderTransport } from "../../apps/backend/src/execution/pipeline/provider-transport.js";
import { evaluateWithVoiceJudge, runVoiceJudgePass } from "../../apps/backend/src/execution/quality/voice-judge.js";
import { readBackendConfig } from "../../apps/backend/src/config/config.js";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";

const voiceProfile: VoiceProfile = {
  userId: "user-1",
  tone: "informal",
  cadence: "direct",
  lexicon: [],
  constraints: [],
  examples: ["Eu observo antes de concluir.", "O contexto importa mais que a resposta rápida."],
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
  }
};

function candidate(laneId: string, finalScore: number, driftScore: number): CandidateText {
  return {
    laneId,
    draft: "draft",
    humanizedDraft: "humanized",
    refinedDraft: `Refined candidate ${laneId} with observational tone.`,
    critic: { findings: [], score: 80 },
    fidelity: { passed: true, score: 80, notes: [] },
    drift: { score: driftScore, notes: [] },
    score: {
      criticScore: 80,
      fidelityScore: 80,
      driftScore: driftScore,
      strategyBonus: 0,
      finalScore
    }
  };
}

describe("voice judge integration", () => {
  const aiAdapters = createAIAdapterService(registerDefaultAIProviders(createAIAdapterRegistry()));
  const providerTransport = createBackendProviderTransport({
    ...readBackendConfig({ NODE_ENV: "test" }),
    environment: "test"
  });
  const attempts = [{ provider: "groq", model: "llama-3.3-70b-versatile", timeoutMs: 5000 }];

  it("scores finalists with mocked groq transport in strict mode", async () => {
    const candidates = [candidate("lane-a", 81, 75), candidate("lane-b", 80, 74)];

    const judged = await Effect.runPromise(
      runVoiceJudgePass({
        candidates,
        voiceProfile,
        qualityMode: "strict",
        reasoningSignatureEnabled: true,
        attempts,
        aiAdapters,
        providerTransport
      })
    );

    const laneA = judged.find((item) => item.laneId === "lane-a");
    expect(laneA?.score.finalScore).toBeGreaterThan(0);
  });

  it("falls back when groq response is invalid and keeps heuristics-only selection", async () => {
    const score = await Effect.runPromise(
      evaluateWithVoiceJudge({
        candidate: candidate("lane-a", 80, 70),
        voiceProfile,
        qualityMode: "strict",
        attempts: [{ provider: "groq", model: "invalid-model", timeoutMs: 1000 }],
        aiAdapters,
        providerTransport: {
          complete: () =>
            Effect.succeed({
              choices: [{ message: { content: "not-json" }, finish_reason: "stop" }]
            })
        }
      })
    );

    expect(score).toBeUndefined();
  });

  it("records fallback observability when judge response cannot be parsed", async () => {
    const observability = await Effect.runPromise(createBackendObservabilityService());

    await Effect.runPromise(
      evaluateWithVoiceJudge({
        candidate: candidate("lane-a", 80, 70),
        voiceProfile,
        qualityMode: "strict",
        attempts: [{ provider: "groq", model: "llama-3.3-70b-versatile" }],
        aiAdapters,
        providerTransport: {
          complete: () =>
            Effect.succeed({
              choices: [{ message: { content: "not-json" }, finish_reason: "stop" }]
            })
        },
        observability,
        pipelineName: "linkedin-post"
      })
    );

    const snapshot = await Effect.runPromise(observability.snapshot());
    expect(snapshot.counters.voice_judge_fallback).toBe(1);
  });
});
