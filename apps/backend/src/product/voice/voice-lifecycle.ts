import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type {
  BackendVoiceService,
} from "./voice-types.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import { createVoiceLifecycleListOperations } from "./voice-lifecycle-list.js";
import { createVoiceLifecycleMutationOperations } from "./voice-lifecycle-mutations.js";

export function createVoiceLifecycleOperations(
  database: DatabaseClient,
  voiceRebuild: BackendVoiceRebuildService,
  now: () => Date,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService
): Pick<
  BackendVoiceService,
  "listExamples" | "createExample" | "updateExample"
> {
  return {
    ...createVoiceLifecycleListOperations(database),
    ...createVoiceLifecycleMutationOperations(database, voiceRebuild, now, logger, voiceConsent)
  };
}
