import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { BackendConfig } from "../../config/config.js";

export function isGenerationCompositorEnabled(
  featureFlags: FeatureFlagServiceContract,
  config: BackendConfig
): boolean {
  return featureFlags.isEnabled("generation.compositor_v1", {
    environment: config.environment
  });
}
