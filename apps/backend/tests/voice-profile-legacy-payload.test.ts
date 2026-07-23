import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { VoiceProfileScreenViewSchema } from "@my-ai-orchestrator/contracts";
import { extractDeterministicFeatures } from "../src/product/voice/deterministic-extraction.js";

// A profile persisted before the perspective axes existed. Postgres hands this back verbatim (the
// repository casts, it does not decode) and validateResponseBody decodes it on the way OUT, so a
// required field here is not a type question — it is an HTTP 500 on every pre-existing author.
function legacyScreenView(): unknown {
  const aggregate = { ...extractDeterministicFeatures("Texto de referência para o agregado.") } as Record<
    string,
    number
  >;
  delete aggregate.firstPersonRatio;
  delete aggregate.thirdPersonRatio;

  return {
    profile: {
      userId: "user_1",
      snapshotId: "snap_1",
      version: 3,
      confidence: "medium",
      primaryLanguage: "pt-BR",
      tone: "direto",
      cadence: "media",
      lexicon: [],
      constraints: [],
      styleMarkers: [],
      rules: [],
      antiPatterns: []
    },
    diagnostics: {
      updating: false,
      activeVersion: 3,
      reasonCodes: [],
      nextActionCodes: [],
      bestCoveredContentTypes: [],
      underrepresentedContentTypes: [],
      pendingRebuild: { status: "idle", nextActionCodes: [] }
    },
    materialBase: {
      totalExamples: 4,
      activeExamples: 4,
      excludedExamples: 0,
      pinnedExamples: 0,
      byClassification: {},
      byContentType: {},
      byLanguage: {}
    },
    quantitativeSignals: {
      aggregate,
      consistencyScore: 0.9,
      topicIndependenceScore: 0.9,
      crossLengthConsistency: 0.9,
      extractionQuality: {
        reasoningExtracted: true,
        developmentExtracted: true,
        reconciliationNeeded: false
      }
    }
  };
}

describe("voice profile legacy payload", () => {
  it("decodes a profile stored before the perspective axes existed", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(VoiceProfileScreenViewSchema)(legacyScreenView())
    );

    expect(decoded.quantitativeSignals?.aggregate.firstPersonRatio).toBe(0);
    expect(decoded.quantitativeSignals?.aggregate.thirdPersonRatio).toBe(0);
  });
});
