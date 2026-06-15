import { Effect } from "effect";

export interface BackendVoiceRebuildService {
  readonly schedule: (userId: string) => Effect.Effect<void>;
  readonly drain: (userId?: string) => Effect.Effect<void>;
}
