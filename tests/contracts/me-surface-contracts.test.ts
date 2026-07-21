import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  ExecutionStatusViewSchema,
  MeExecutionRequestSchema,
  VoiceProfileScreenViewSchema,
  decodeVoiceProfileScreenView
} from "../../packages/contracts/src/index.js";

describe("me surface contracts", () => {
  it("decodes the consolidated voice profile view", () => {
    const value = Schema.decodeUnknownSync(VoiceProfileScreenViewSchema)({
      profile: {
        userId: "user_1",
        snapshotId: "voice-snapshot-effective-12",
        version: 12,
        confidence: "medium",
        primaryLanguage: "pt-BR",
        tone: "informal",
        cadence: "direct",
        description: "Português direto, pessoal e observacional.",
        lexicon: ["produto", "cliente"],
        constraints: ["preserve user voice"],
        styleMarkers: ["primeira pessoa", "parágrafos curtos"],
        rules: ["prefer direct openings"],
        antiPatterns: ["o problema", "a solução"]
      },
      diagnostics: {
        updating: true,
        activeVersion: 12,
        pendingVersion: 13,
        summary: "Sua voz está consistente, mas ainda falta diversidade entre formatos.",
        reasonCodes: ["insufficient_diversity"],
        nextActionCodes: ["add_examples_from_other_content_types"],
        bestCoveredContentTypes: [
          {
            contentType: "linkedin-post",
            coverage: "high",
            reasonCodes: ["insufficient_examples"]
          }
        ],
        underrepresentedContentTypes: [
          {
            contentType: "newsletter",
            coverage: "low",
            reasonCodes: ["insufficient_diversity"]
          }
        ],
        pendingRebuild: {
          status: "in_progress",
          nextActionCodes: ["wait_for_profile_update"]
        }
      },
      materialBase: {
        totalExamples: 8,
        activeExamples: 6,
        excludedExamples: 2,
        pinnedExamples: 2,
        byClassification: {
          positive: 5,
          negative: 1,
          redundant: 2
        },
        byContentType: {
          "linkedin-post": 4,
          newsletter: 2,
          "long-form-blog": 2
        },
        byLanguage: {
          "pt-BR": 7,
          "en-US": 1
        }
      }
    });

    expect(value.profile.snapshotId).toBe("voice-snapshot-effective-12");
    expect(value.diagnostics.pendingVersion).toBe(13);
    expect(value.materialBase.byContentType["linkedin-post"]).toBe(4);
  });

  it("decodes the authenticated execution request", () => {
    const value = Schema.decodeUnknownSync(MeExecutionRequestSchema)({
      rhetoricalMode: "promote",
      scope: { lengthTier: "long", channel: "email" },
      briefing: {
        topic: "Migração para Hono + Effect",
        audience: "engenheiros"
      },
      qualityMode: "strict",
      quoteId: "quote_1",
      includeTrace: true,
      idempotencyKey: "exec_1"
    });

    expect(value.rhetoricalMode).toBe("promote");
    expect(value.scope?.lengthTier).toBe("long");
    expect(value.qualityMode).toBe("strict");
    expect(value.quoteId).toBe("quote_1");
    expect(value.idempotencyKey).toBe("exec_1");
  });

  it("decodes an execution status view with effective voice metadata", () => {
    const value = Schema.decodeUnknownSync(ExecutionStatusViewSchema)({
      jobId: "job_1",
      status: "done",
      contentType: "linkedin-post",
      progress: null,
      result: {
        content: "Texto final com voz adaptada.",
        metadata: {
          mode: "async"
        }
      },
      error: null,
      createdAt: "2026-05-14T10:00:00.000Z",
      completedAt: "2026-05-14T10:02:00.000Z",
      voice: {
        voiceProfileConfidence: "medium",
        voiceAdaptationMode: "standard",
        voiceProfileVersionUsed: 12,
        pendingVoiceProfileVersion: 13,
        voiceProfileSnapshotId: "snapshot_effective_12_linkedin",
        usedFallbackVoiceProfile: true,
        fallbackReasonCode: "rebuild_in_progress",
        appliedSignals: {
          styleMarkers: ["primeira pessoa"],
          rules: ["prefer direct openings"],
          antiPatterns: ["o problema"]
        },
        pendingProfileRebuild: {
          status: "in_progress",
          nextActionCodes: ["wait_for_profile_update"]
        }
      }
    });

    expect(value.voice?.voiceProfileSnapshotId).toBe("snapshot_effective_12_linkedin");
    expect(value.voice?.usedFallbackVoiceProfile).toBe(true);
  });

  it("fails decoding when a canonical reason code is invalid", async () => {
    const result = await Effect.runPromise(
      Effect.either(
        decodeVoiceProfileScreenView({
          profile: {
            userId: "user_1",
            snapshotId: "snapshot_1",
            version: 1,
            confidence: "medium",
            primaryLanguage: "pt-BR",
            tone: "informal",
            cadence: "direct",
            lexicon: [],
            constraints: [],
            styleMarkers: [],
            rules: [],
            antiPatterns: []
          },
          diagnostics: {
            updating: false,
            activeVersion: 1,
            summary: "ok",
            reasonCodes: ["not_a_reason_code"],
            nextActionCodes: [],
            bestCoveredContentTypes: [],
            underrepresentedContentTypes: [],
            pendingRebuild: {
              status: "idle",
              nextActionCodes: []
            }
          },
          materialBase: {
            totalExamples: 0,
            activeExamples: 0,
            excludedExamples: 0,
            pinnedExamples: 0,
            byClassification: {},
            byContentType: {},
            byLanguage: {}
          }
        })
      )
    );

    expect(result._tag).toBe("Left");
  });
});
