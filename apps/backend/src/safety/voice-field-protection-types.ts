import { Effect } from "effect";
import type {
  VoiceExampleRecord
} from "@my-ai-orchestrator/database";
import type { VoiceExample } from "@my-ai-orchestrator/domain";
import type { BackendVoiceTrainingConsentFailureError } from "../http/errors.js";

export interface BackendVoiceFieldProtectionService {
  readonly protectVoiceExample: <T extends VoiceExample | VoiceExampleRecord>(
    record: T
  ) => Effect.Effect<T, BackendVoiceTrainingConsentFailureError>;
  readonly unprotectVoiceExample: <T extends VoiceExample | VoiceExampleRecord>(
    record: T
  ) => Effect.Effect<T, BackendVoiceTrainingConsentFailureError>;
}
