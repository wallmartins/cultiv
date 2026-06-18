import type { AppLogger } from "@my-ai-orchestrator/core";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BackendObservabilityService } from "../core/observability-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BackendVoiceRebuildService } from "./voice-rebuild-types.js";
import { createVoiceRebuildQueue } from "./voice-rebuild-queue.js";
import {
  createVoiceRebuildPipelineHandlers,
  type BackendVoiceRebuildDependencies
} from "./voice-rebuild-pipeline.js";

export type { BackendVoiceRebuildDependencies } from "./voice-rebuild-pipeline.js";

export function createBackendVoiceRebuildService(
  database: DatabaseClient,
  now: () => Date,
  observability: BackendObservabilityService,
  logger?: AppLogger,
  voiceConsent?: BackendVoiceConsentService,
  dependencies: BackendVoiceRebuildDependencies = {}
): BackendVoiceRebuildService {
  const pipeline = createVoiceRebuildPipelineHandlers({
    database,
    now,
    observability,
    logger,
    voiceConsent,
    dependencies
  });

  return createVoiceRebuildQueue({
    now,
    observability,
    logger,
    processUserRebuild: pipeline.processUserRebuild,
    markRebuildQueued: pipeline.markRebuildQueued
  });
}
