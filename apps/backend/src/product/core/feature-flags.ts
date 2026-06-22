import type { BackendConfig } from "../../config/config.js";
import { DEFAULT_FEATURE_FLAGS, type FeatureFlagDefinition } from "@my-ai-orchestrator/feature-flags";

export function resolveBackendFeatureFlags(config: BackendConfig): readonly FeatureFlagDefinition[] {
  const resolvedFlags = DEFAULT_FEATURE_FLAGS.map((flag) => {
    if (flag.key === "execution.sync_mode") {
      return {
        ...flag,
        enabled: config.executionMode === "sync",
        defaultVariant: config.executionMode === "sync" ? "sync" : "async"
      };
    }

    if (flag.key === "content.language.refinement") {
      return {
        ...flag,
        enabled: true
      };
    }

    if (flag.key === "voice.reasoningSignatureV1") {
      return {
        ...flag,
        enabled: config.reasoningSignatureV1Enabled === true,
        defaultVariant: config.reasoningSignatureV1Enabled === true ? "on" : "off"
      };
    }

    if (flag.key === "generation.compositor_v1") {
      return {
        ...flag,
        enabled: config.compositorV1Enabled === true,
        defaultVariant: config.compositorV1Enabled === true ? "on" : "off"
      };
    }

    if (flag.key === "generation.step_planner_v1") {
      return {
        ...flag,
        enabled: config.stepPlannerV1Enabled === true && config.compositorV1Enabled === true,
        defaultVariant:
          config.stepPlannerV1Enabled === true && config.compositorV1Enabled === true ? "on" : "off"
      };
    }

    return flag;
  });

  return [
    ...resolvedFlags,
    {
      key: "execution.experimental_debug",
      scope: "execution",
      enabled: config.experimentalDebugEnabled === true,
      description: "Allows the guarded internal experimental pipeline flow",
      defaultVariant: config.experimentalDebugEnabled === true ? "enabled" : "disabled",
      variants: ["disabled", "enabled"]
    }
  ];
}
