import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  ContentTypeCatalogViewSchema,
  ExecutionStatusViewSchema,
  MeExecutionRequestSchema,
  VoiceExampleCreateInputSchema,
  VoiceExamplesPageViewSchema,
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
        adaptationMode: "conservative",
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

  it("decodes the voice examples page view", () => {
    const value = Schema.decodeUnknownSync(VoiceExamplesPageViewSchema)({
      items: [
        {
          exampleId: "example_1",
          version: 2,
          state: "active",
          text: "Eu gosto de abrir textos com observações concretas.",
          previewText: "Eu gosto de abrir textos...",
          language: "pt-BR",
          channel: "linkedin",
          format: "post",
          explicitContentType: "linkedin-post",
          effectiveContentTypeHints: ["linkedin-post"],
          classificationLabels: ["positive", "representative"],
          pinned: true,
          pendingProfileImpact: true,
          targetProfileVersion: 14,
          evaluation: {
            systemWeight: 0.92,
            attentionLevel: "low",
            attentionReasonCodes: [],
            contributionCode: "supports_first_person_voice",
            contributionPreview: "Ajuda a sustentar primeira pessoa.",
            userPinned: true
          },
          createdAt: "2026-05-14T10:00:00.000Z",
          updatedAt: "2026-05-14T10:05:00.000Z"
        }
      ],
      total: 1,
      limit: 20,
      offset: 0
    });

    expect(value.items).toHaveLength(1);
    expect(value.items[0]?.evaluation.userPinned).toBe(true);
    expect(value.items[0]?.targetProfileVersion).toBe(14);
  });

  it("decodes a create input for voice examples", () => {
    const value = Schema.decodeUnknownSync(VoiceExampleCreateInputSchema)({
      text: "Escrevo assim quando quero soar mais técnico.",
      language: "pt-BR",
      explicitContentType: "architecture-post",
      context: "Post técnico após revisão de arquitetura",
      pinned: false,
      performance: {
        channel: "linkedin",
        selfRating: 4,
        likes: 120,
        comments: 18
      }
    });

    expect(value.explicitContentType).toBe("architecture-post");
    expect(value.performance?.likes).toBe(120);
  });

  it("decodes the content types catalog view", () => {
    const value = Schema.decodeUnknownSync(ContentTypeCatalogViewSchema)({
      items: [
        {
          id: "linkedin-post",
          label: "LinkedIn Post",
          available: false,
          reasonCode: "plan_restriction",
          defaultLanguage: "pt-BR",
          supportedLanguages: ["pt-BR", "en-US"],
          steps: ["hook", "draft", "refine"],
          inputSchema: [
            {
              key: "topic",
              label: "Tema",
              type: "string",
              required: true,
              highImpact: true,
              helpText: "Descreva o ponto central do post."
            }
          ],
          briefingGuidance: {
            objective: "Gerar um post curto, humano e publicável.",
            tips: ["Use um insight concreto.", "Evite briefing genérico."],
            exampleBriefing: "Quero um post sobre trade-offs de monorepo.",
            commonMistakes: ["Tema amplo demais"]
          },
          briefingGuidanceByLanguage: {
            "en-US": {
              objective: "Generate a concise, publishable LinkedIn post.",
              tips: ["Use a concrete insight."],
              exampleBriefing: "I want a post about monorepo trade-offs.",
              commonMistakes: ["Topic too broad"]
            }
          }
        }
      ]
    });

    expect(value.items[0]?.available).toBe(false);
    expect(value.items[0]?.reasonCode).toBe("plan_restriction");
    expect(value.items[0]?.inputSchema[0]?.highImpact).toBe(true);
  });

  it("decodes the authenticated execution request", () => {
    const value = Schema.decodeUnknownSync(MeExecutionRequestSchema)({
      contentType: "newsletter",
      briefing: {
        topic: "Migração para Hono + Effect",
        audience: "engenheiros"
      },
      qualityMode: "strict",
      quoteId: "quote_1",
      includeTrace: true,
      idempotencyKey: "exec_1"
    });

    expect(value.contentType).toBe("newsletter");
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
            adaptationMode: "standard",
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
