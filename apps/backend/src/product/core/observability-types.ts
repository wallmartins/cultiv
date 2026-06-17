import { Effect } from "effect";

export type BackendObservabilityEventKind =
  | "voice_rebuild_queued"
  | "voice_rebuild_started"
  | "voice_rebuild_completed"
  | "voice_rebuild_failed"
  | "voice_batch_committed"
  | "voice_snapshot_persisted"
  | "voice_refresh_event"
  | "voice_judge_invoked"
  | "voice_judge_fallback"
  | "voice_reasoning_extraction_failed";

export interface BackendObservabilityEvent {
  readonly kind: BackendObservabilityEventKind;
  readonly occurredAt: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface BackendObservabilitySnapshot {
  readonly counters: Readonly<Record<BackendObservabilityEventKind, number>>;
  readonly events: readonly BackendObservabilityEvent[];
}

export interface BackendObservabilityService {
  readonly recordVoiceRebuildQueued: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceRebuildStarted: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceRebuildCompleted: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceRebuildFailed: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceBatchCommitted: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceSnapshotPersisted: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceRefreshEvent: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceJudgeInvoked: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceJudgeFallback: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly recordVoiceReasoningExtractionFailed: (details: Readonly<Record<string, unknown>>) => Effect.Effect<void, never>;
  readonly snapshot: () => Effect.Effect<BackendObservabilitySnapshot, never>;
}
