import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BackendObservabilityService } from "../src/product/core/observability-types.js";
import type { BackendVoiceConsentService } from "../src/safety/voice-consent-types.js";
import { createVoiceRebuildPipelineHandlers } from "../src/product/voice/voice-rebuild-pipeline.js";

function createObservabilityRecorder(
  recorded: Array<{ kind: string; details: Readonly<Record<string, unknown>> }>
): BackendObservabilityService {
  const record =
    (kind: string) => (details: Readonly<Record<string, unknown>>) =>
      Effect.sync(() => {
        recorded.push({ kind, details });
      });

  return {
    recordVoiceRebuildQueued: record("voice_rebuild_queued"),
    recordVoiceRebuildStarted: record("voice_rebuild_started"),
    recordVoiceRebuildCompleted: record("voice_rebuild_completed"),
    recordVoiceRebuildFailed: record("voice_rebuild_failed"),
    recordVoiceBatchCommitted: record("voice_batch_committed"),
    recordVoiceSnapshotPersisted: record("voice_snapshot_persisted"),
    recordVoiceRefreshEvent: record("voice_refresh_event"),
    recordVoiceJudgeInvoked: record("voice_judge_invoked"),
    recordVoiceJudgeFallback: record("voice_judge_fallback"),
    recordVoiceReasoningExtractionFailed: record("voice_reasoning_extraction_failed"),
    recordVoiceDevelopmentExtractionFailed: record("voice_development_extraction_failed"),
    recordVoiceSignatureReconciliationInvoked: record("voice_signature_reconciliation_invoked"),
    recordVoiceSignatureReconciliationSkipped: record("voice_signature_reconciliation_skipped"),
    recordVoiceSignatureReconciliationFailed: record("voice_signature_reconciliation_failed"),
    recordTraitConfidenceComputed: record("trait_confidence_computed"),
    recordTraitConfirmationRecorded: record("trait_confirmation_recorded"),
    snapshot: () => Effect.succeed({ counters: {} as never, events: [] })
  };
}

function createTrackingDatabase(tracked: { profilePuts: number; diagnosticsPuts: number }): DatabaseClient {
  const emptyGet = () => Effect.succeed(undefined);
  const emptyList = () => Effect.succeed([]);

  return {
    voiceProfiles: {
      getByUser: emptyGet,
      put: () =>
        Effect.sync(() => {
          tracked.profilePuts += 1;
        })
    },
    voiceProfileDiagnostics: {
      getByUser: emptyGet,
      put: () =>
        Effect.sync(() => {
          tracked.diagnosticsPuts += 1;
        })
    },
    voiceExamples: {
      listByUser: emptyList,
      save: () => Effect.void
    }
  } as unknown as DatabaseClient;
}

describe("voice rebuild pipeline", () => {
  it("skips processing and records consent_revoked when consent is not active", async () => {
    const events: Array<{ kind: string; details: Readonly<Record<string, unknown>> }> = [];
    const writes = { profilePuts: 0, diagnosticsPuts: 0 };
    const voiceConsent: BackendVoiceConsentService = {
      grantConsent: () => Effect.void,
      revokeConsent: () => Effect.void,
      getConsentStatus: () => Effect.succeed({ granted: false, revokedAt: undefined })
    };

    const { processUserRebuild } = createVoiceRebuildPipelineHandlers({
      database: createTrackingDatabase(writes),
      now: () => new Date("2026-06-18T12:00:00.000Z"),
      observability: createObservabilityRecorder(events),
      voiceConsent
    });

    await Effect.runPromise(processUserRebuild("user-consent-skip"));

    expect(events).toEqual([
      {
        kind: "voice_rebuild_failed",
        details: { userId: "user-consent-skip", reason: "consent_revoked" }
      }
    ]);
    expect(writes.profilePuts).toBe(0);
    expect(writes.diagnosticsPuts).toBe(0);
  });

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

    const { markRebuildQueued } = createVoiceRebuildPipelineHandlers({
      database,
      now: () => new Date("2026-06-18T12:00:00.000Z"),
      observability: createObservabilityRecorder([])
    });

    await Effect.runPromise(markRebuildQueued("user-queued"));

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
});
