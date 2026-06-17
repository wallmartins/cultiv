import { Effect, Ref } from "effect";
import type {
  BackendObservabilityEvent,
  BackendObservabilityEventKind,
  BackendObservabilityService,
  BackendObservabilitySnapshot
} from "./observability-types.js";
import type { BackendRedactionService } from "../../safety/redaction-types.js";

interface BackendObservabilityState {
  readonly counters: Record<BackendObservabilityEventKind, number>;
  readonly events: BackendObservabilityEvent[];
}

const emptyCounters: Record<BackendObservabilityEventKind, number> = {
  voice_rebuild_queued: 0,
  voice_rebuild_started: 0,
  voice_rebuild_completed: 0,
  voice_rebuild_failed: 0,
  voice_batch_committed: 0,
  voice_snapshot_persisted: 0,
  voice_refresh_event: 0,
  voice_judge_invoked: 0,
  voice_judge_fallback: 0,
  voice_reasoning_extraction_failed: 0
};

export function createBackendObservabilityService(
  redaction?: BackendRedactionService
): Effect.Effect<BackendObservabilityService, never> {
  return Effect.gen(function* () {
    const stateRef = yield* Ref.make<BackendObservabilityState>({
      counters: { ...emptyCounters },
      events: []
    });

    const record = (kind: BackendObservabilityEventKind, details: Readonly<Record<string, unknown>>) => {
      const safeDetails = redaction
        ? redaction.redactObject(details as Record<string, unknown>).redacted
        : details;
      return Ref.update(stateRef, (state) => ({
        counters: {
          ...state.counters,
          [kind]: state.counters[kind] + 1
        },
        events: [
          ...state.events,
          {
            kind,
            occurredAt: new Date().toISOString(),
            details: safeDetails
          }
        ]
      }));
    };

    const snapshot = () =>
      Ref.get(stateRef).pipe(
        Effect.map((state): BackendObservabilitySnapshot => ({
          counters: state.counters,
          events: [...state.events]
        }))
      );

    return {
      recordVoiceRebuildQueued: (details) => record("voice_rebuild_queued", details),
      recordVoiceRebuildStarted: (details) => record("voice_rebuild_started", details),
      recordVoiceRebuildCompleted: (details) => record("voice_rebuild_completed", details),
      recordVoiceRebuildFailed: (details) => record("voice_rebuild_failed", details),
      recordVoiceBatchCommitted: (details) => record("voice_batch_committed", details),
      recordVoiceSnapshotPersisted: (details) => record("voice_snapshot_persisted", details),
      recordVoiceRefreshEvent: (details) => record("voice_refresh_event", details),
      recordVoiceJudgeInvoked: (details) => record("voice_judge_invoked", details),
      recordVoiceJudgeFallback: (details) => record("voice_judge_fallback", details),
      recordVoiceReasoningExtractionFailed: (details) => record("voice_reasoning_extraction_failed", details),
      snapshot
    };
  });
}
