import type { OrchestrationPolicy } from "./orchestrator-types.js";
import { createDefaultOrchestrationCatalog } from "./catalog.js";

export const DEFAULT_ORCHESTRATION_POLICY: OrchestrationPolicy = {
  allowPartialResults: true,
  retryLimitPerStep: 2,
  defaultExecutionMode: "sync",
  defaultQualityMode: "balanced",
  defaultLanguage: "pt-BR"
};

export const DEFAULT_ORCHESTRATION_CATALOG = createDefaultOrchestrationCatalog();
