import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  createDatabase,
  DatabaseVoiceExampleAlreadyExistsError,
  hydrateDatabase,
  toVoiceExampleDomain,
  toVoiceExampleRecord,
  toVoiceProfileDiagnosticsDomain,
  toVoiceProfileDiagnosticsRecord,
  toVoiceProfileDomain,
  toVoiceProfileRecord,
  toVoiceProfileSnapshotDomain,
  toVoiceProfileSnapshotRecord
} from "../../packages/database/src/index.js";

describe("database voice aggregate", () => {
  it("maps voice domain records to persistent records and back", () => {
    const exampleRecord = toVoiceExampleRecord({
      id: "example_1",
      userId: "user_1",
      text: "Eu escrevo de forma direta.",
      language: "pt-BR",
      state: "active",
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: false,
      pendingProfileImpact: true,
      effectiveContentTypeHints: ["linkedin-post"],
      evaluation: {
        systemWeight: 0.8,
        attentionLevel: "low",
        attentionReasonCodes: [],
        contributionCode: "supports_first_person_voice",
        contributionPreview: "Sustenta primeira pessoa.",
        userPinned: false
      },
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    });
    const profileRecord = toVoiceProfileRecord({
      id: "voice-profile:user_1",
      userId: "user_1",
      version: 2,
      snapshotId: "snapshot_2",
      confidence: "medium",
      primaryLanguage: "pt-BR",
      tone: "informal",
      cadence: "direct",
      lexicon: ["produto"],
      constraints: ["preserve user voice"],
      styleMarkers: ["primeira pessoa"],
      rules: ["prefer direct openings"],
      antiPatterns: ["o problema"],
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    });
    const diagnosticsRecord = toVoiceProfileDiagnosticsRecord({
      id: "voice-diagnostics:user_1",
      userId: "user_1",
      activeVersion: 2,
      updating: false,
      reasonCodes: [],
      nextActionCodes: [],
      bestCoveredContentTypes: [],
      underrepresentedContentTypes: [],
      pendingRebuild: {
        status: "idle",
        nextActionCodes: []
      },
      materialBase: {
        totalExamples: 1,
        activeExamples: 1,
        excludedExamples: 0,
        pinnedExamples: 0,
        byClassification: { positive: 1 },
        byContentType: { "linkedin-post": 1 },
        byLanguage: { "pt-BR": 1 }
      },
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    });
    const snapshotRecord = toVoiceProfileSnapshotRecord({
      id: "snapshot_effective_2_linkedin",
      userId: "user_1",
      sourceProfileId: "voice-profile:user_1",
      sourceProfileVersion: 2,
      channel: "professional-network",
      confidence: "medium",
      adaptationMode: "standard",
      appliedSignals: {
        styleMarkers: ["primeira pessoa"],
        rules: ["prefer direct openings"],
        antiPatterns: ["o problema"]
      },
      resolutionContext: {
        channel: "professional-network"
      },
      createdAt: "2026-05-14T00:00:00.000Z"
    });

    expect(exampleRecord.version).toBe(1);
    expect(toVoiceExampleDomain(exampleRecord).text).toBe("Eu escrevo de forma direta.");
    expect(profileRecord.version).toBe(1);
    expect(profileRecord.profileVersion).toBe(2);
    expect(toVoiceProfileDomain(profileRecord).snapshotId).toBe("snapshot_2");
    expect(diagnosticsRecord.version).toBe(1);
    expect(toVoiceProfileDiagnosticsDomain(diagnosticsRecord).materialBase.totalExamples).toBe(1);
    expect(snapshotRecord.version).toBe(1);
    expect(toVoiceProfileSnapshotDomain(snapshotRecord).channel).toBe("professional-network");
  });

  it("persists voice examples, profiles, snapshots and batches", () => {
    const database = createDatabase();

    const example = Effect.runSync(database.voiceExamples.create({
      id: "example_2",
      userId: "user_1",
      text: "Texto base.",
      language: "pt-BR",
      state: "active",
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: true,
      pendingProfileImpact: true,
      targetProfileVersion: 3,
      effectiveContentTypeHints: ["newsletter"],
      evaluation: {
        systemWeight: 0.9,
        attentionLevel: "medium",
        attentionReasonCodes: ["low_specificity"],
        contributionCode: "useful_for_newsletter",
        contributionPreview: "Ãštil para newsletter.",
        userPinned: true
      },
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    }));

    const profile = Effect.runSync(database.voiceProfiles.put({
      id: "voice-profile:user_1",
      userId: "user_1",
      version: 3,
      snapshotId: "snapshot_3",
      confidence: "high",
      primaryLanguage: "pt-BR",
      tone: "direct",
      cadence: "balanced",
      lexicon: ["migraÃ§Ã£o"],
      constraints: ["preserve factual fidelity"],
      styleMarkers: ["parÃ¡grafos curtos"],
      rules: ["prefer direct openings"],
      antiPatterns: ["a soluÃ§Ã£o"],
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:10:00.000Z"
    }));

    const diagnostics = Effect.runSync(database.voiceProfileDiagnostics.put({
      id: "voice-diagnostics:user_1",
      userId: "user_1",
      activeVersion: 3,
      pendingVersion: 4,
      updating: true,
      summary: "Novo profile em processamento.",
      reasonCodes: ["rebuild_in_progress"],
      nextActionCodes: ["wait_for_profile_update"],
      bestCoveredContentTypes: [],
      underrepresentedContentTypes: [],
      pendingRebuild: {
        status: "in_progress",
        nextActionCodes: ["wait_for_profile_update"]
      },
      materialBase: {
        totalExamples: 1,
        activeExamples: 1,
        excludedExamples: 0,
        pinnedExamples: 1,
        byClassification: { positive: 1 },
        byContentType: { newsletter: 1 },
        byLanguage: { "pt-BR": 1 }
      },
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:10:00.000Z"
    }));

    const snapshot = Effect.runSync(database.voiceProfileSnapshots.create({
      id: "snapshot_effective_3_newsletter",
      userId: "user_1",
      sourceProfileId: "voice-profile:user_1",
      sourceProfileVersion: 3,
      channel: "email",
      confidence: "high",
      adaptationMode: "standard",
      appliedSignals: {
        styleMarkers: ["parÃ¡grafos curtos"],
        rules: ["prefer direct openings"],
        antiPatterns: ["a soluÃ§Ã£o"]
      },
      resolutionContext: {
        channel: "email"
      },
      createdAt: "2026-05-14T00:10:00.000Z"
    }));

    expect(example.pinned).toBe(true);
    expect(profile.snapshotId).toBe("snapshot_3");
    expect(profile.profileVersion).toBe(3);
    expect(diagnostics.pendingVersion).toBe(4);
    expect(snapshot.sourceProfileVersion).toBe(3);

    expect(Effect.runSync(database.voiceExamples.listByUser("user_1"))).toHaveLength(1);
    expect(Effect.runSync(database.voiceProfiles.getByUser("user_1"))?.version).toBe(1);
    expect(Effect.runSync(database.voiceProfileDiagnostics.getByUser("user_1"))?.pendingVersion).toBe(4);
    expect(Effect.runSync(database.voiceProfileSnapshots.listByUser("user_1"))).toHaveLength(1);
  });

  it("rehydrates voice aggregate state from a snapshot", () => {
    const database = createDatabase();
    Effect.runSync(database.voiceExamples.create({
      id: "example_3",
      userId: "user_2",
      text: "Exemplo reidratado.",
      language: "pt-BR",
      state: "active",
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: false,
      pendingProfileImpact: false,
      effectiveContentTypeHints: ["linkedin-post"],
      evaluation: {
        systemWeight: 0.7,
        attentionLevel: "low",
        attentionReasonCodes: [],
        contributionCode: "useful_for_linkedin",
        contributionPreview: "Bom para LinkedIn.",
        userPinned: false
      },
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    }));

    const snapshot = database.snapshot();
    const rehydrated = hydrateDatabase(snapshot);
    const example = Effect.runSync(rehydrated.voiceExamples.get("example_3"));

    expect(example?.text).toBe("Exemplo reidratado.");
    expect(Effect.runSync(rehydrated.voiceExamples.listByUser("user_2"))).toHaveLength(1);
  });

  it("throws typed errors for duplicate voice examples", () => {
    const database = createDatabase();
    Effect.runSync(database.voiceExamples.create({
      id: "example_4",
      userId: "user_1",
      text: "Duplicado.",
      language: "pt-BR",
      state: "active",
      classificationLabels: ["positive"],
      antiPatternsExplicit: [],
      pinned: false,
      pendingProfileImpact: false,
      effectiveContentTypeHints: [],
      evaluation: {
        systemWeight: 0.5,
        attentionLevel: "low",
        attentionReasonCodes: [],
        contributionCode: "useful_for_blog",
        contributionPreview: "Ãštil para blog.",
        userPinned: false
      },
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    }));

    const duplicateExample = Effect.runSync(
      Effect.either(
        database.voiceExamples.create({
          id: "example_4",
          userId: "user_1",
          text: "Duplicado.",
          language: "pt-BR",
          state: "active",
          classificationLabels: ["positive"],
          antiPatternsExplicit: [],
          pinned: false,
          pendingProfileImpact: false,
          effectiveContentTypeHints: [],
          evaluation: {
            systemWeight: 0.5,
            attentionLevel: "low",
            attentionReasonCodes: [],
            contributionCode: "useful_for_blog",
            contributionPreview: "Ãštil para blog.",
            userPinned: false
          },
          createdAt: "2026-05-14T00:00:00.000Z",
          updatedAt: "2026-05-14T00:00:00.000Z"
        })
      )
    );

    expect(duplicateExample._tag).toBe("Left");
    expect(duplicateExample.left).toBeInstanceOf(DatabaseVoiceExampleAlreadyExistsError);
  });
});
