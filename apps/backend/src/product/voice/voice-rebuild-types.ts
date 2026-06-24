import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";

export interface BackendVoiceRebuildService {
  readonly schedule: (userId: string) => Effect.Effect<void, DatabaseError>;
  readonly drain: (userId?: string) => Effect.Effect<void>;
}
