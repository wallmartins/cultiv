import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { BackendConfig } from "../../config/config.js";

export function isGenerationStepPlannerEnabled(
  featureFlags: FeatureFlagServiceContract,
  config: BackendConfig
): boolean {
  return featureFlags.isEnabled("generation.step_planner_v1", {
    environment: config.environment
  });
}
