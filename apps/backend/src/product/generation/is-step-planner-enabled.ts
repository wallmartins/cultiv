import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { BackendConfig } from "../../config/config.js";
import { isGenerationCompositorEnabled } from "./is-compositor-enabled.js";

export function isGenerationStepPlannerEnabled(
  featureFlags: FeatureFlagServiceContract,
  config: BackendConfig
): boolean {
  if (!isGenerationCompositorEnabled(featureFlags, config)) {
    return false;
  }

  return featureFlags.isEnabled("generation.step_planner_v1", {
    environment: config.environment
  });
}
