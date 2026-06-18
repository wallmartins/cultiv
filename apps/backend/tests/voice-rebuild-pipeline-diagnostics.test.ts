import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { DatabaseClient, VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type { ArgumentDevelopmentExtractionResult } from "@my-ai-orchestrator/contracts";
import {
  attachTraitProfileToDevelopment,
  clearProfileImpactFlags,
  markRebuildFailure,
  markRebuildQueued
} from "../src/product/voice/voice-rebuild-pipeline-diagnostics.js";

describe("voice rebuild pipeline diagnostics", () => {
  it("marks diagnostics as in_progress when rebuild is queued", async () => {
    const diagnosticsWrites: unknown[] = [];

    const database = {
      voiceProfiles: {
        getByUser: () => Effect.succeed(undefined),
        put: () => Effect.void
      },
      voiceProfileDiagnostics: {
        getByUser: () => Effect.succeed(undefined),
        put: (diagnostics: unknown) =>
          Effect.sync(() => {
            diagnosticsWrites.push(diagnostics);
          })
      },
      voiceExamples: {
        listByUser: () => Effect.succeed([])
      }
    } as unknown as DatabaseClient;

    await Effect.runPromise(
      markRebuildQueued(database, "user-queued", () => new Date("2026-06-18T12:00:00.000Z"))
    );

    expect(diagnosticsWrites).toHaveLength(1);
    expect(diagnosticsWrites[0]).toMatchObject({
      userId: "user-queued",
      updating: true,
      pendingRebuild: {
        status: "in_progress",
        reasonCode: "rebuild_in_progress"
      }
    });
  });

  it("marks diagnostics as failed when rebuild processing fails", async () => {
    const diagnosticsWrites: unknown[] = [];

    const database = {
      voiceProfiles: {
        getByUser: () => Effect.succeed(undefined),
        put: () => Effect.void
      },
      voiceProfileDiagnostics: {
        getByUser: () => Effect.succeed(undefined),
        put: (diagnostics: unknown) =>
          Effect.sync(() => {
            diagnosticsWrites.push(diagnostics);
          })
      },
      voiceExamples: {
        listByUser: () => Effect.succeed([])
      }
    } as unknown as DatabaseClient;

    await Effect.runPromise(
      markRebuildFailure(
        database,
        "user-failed",
        () => new Date("2026-06-18T12:00:00.000Z"),
        new Error("boom")
      )
    );

    expect(diagnosticsWrites).toHaveLength(1);
    expect(diagnosticsWrites[0]).toMatchObject({
      userId: "user-failed",
      updating: false,
      pendingRebuild: {
        status: "failed",
        reasonCode: "processing_failed"
      }
    });
  });

  it("clears pending profile impact flags for examples at or below the active version", async () => {
    const saved: VoiceExampleRecord[] = [];
    const examples: VoiceExampleRecord[] = [
      {
        id: "ex-1",
        pendingProfileImpact: true,
        targetProfileVersion: 2
      } as VoiceExampleRecord,
      {
        id: "ex-2",
        pendingProfileImpact: true,
        targetProfileVersion: 5
      } as VoiceExampleRecord,
      {
        id: "ex-3",
        pendingProfileImpact: false,
        targetProfileVersion: 1
      } as VoiceExampleRecord
    ];

    const database = {
      voiceExamples: {
        save: (example: VoiceExampleRecord) =>
          Effect.sync(() => {
            saved.push(example);
          })
      }
    } as unknown as DatabaseClient;

    await Effect.runPromise(
      clearProfileImpactFlags(database, examples, 3, "2026-06-18T12:00:00.000Z")
    );

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      id: "ex-1",
      pendingProfileImpact: false,
      targetProfileVersion: 3,
      updatedAt: "2026-06-18T12:00:00.000Z"
    });
  });

  it("preserves previous trait profile when confidence pass has no signal", () => {
    const previousTraitProfile = {
      records: {},
      version: 1
    };
    const extraction: ArgumentDevelopmentExtractionResult = {
      development: {
        epistemicPosture: "balanced",
        rhetoricalMoves: []
      }
    };

    const result = attachTraitProfileToDevelopment({
      extraction,
      activeExamples: [],
      previousDevelopment: {
        epistemicPosture: "balanced",
        rhetoricalMoves: [],
        traitProfile: previousTraitProfile
      }
    });

    expect(result.development.traitProfile).toBe(previousTraitProfile);
    expect(result.confidenceMetrics).toBeUndefined();
  });
});
