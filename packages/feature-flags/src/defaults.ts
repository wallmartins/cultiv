import type { FeatureFlagDefinition } from "./types.js";

export const DEFAULT_FEATURE_FLAGS: readonly FeatureFlagDefinition[] = [
  {
    key: "execution.sync_mode",
    scope: "execution",
    enabled: true,
    defaultVariant: "sync",
    variants: ["sync", "async"]
  },
  {
    key: "content.language.refinement",
    scope: "content",
    enabled: true,
    defaultVariant: "on",
    variants: ["on", "off"]
  },
  {
    key: "generation.lexicalQualityV2",
    scope: "content",
    enabled: true,
    defaultVariant: "on",
    variants: ["on", "off"]
  },
  {
    key: "generation.legacy_format_picker",
    scope: "generation",
    enabled: false,
    defaultVariant: "off",
    variants: ["off", "on"]
  },
  {
    key: "generation.compositor_v1",
    scope: "generation",
    enabled: false,
    description: "Use Generation Compositor v1 instead of @phase1-legacy contentType resolver",
    defaultVariant: "off",
    variants: ["off", "on"]
  },
  {
    key: "generation.step_planner_v1",
    scope: "generation",
    enabled: false,
    description: "Apply briefing-driven StepPlanner patches after compositor planning",
    defaultVariant: "off",
    variants: ["off", "on"]
  },
  {
    key: "voice.reasoningSignatureV1",
    scope: "content",
    enabled: false,
    description: "Author reasoning signature extraction, injection, and evaluation",
    defaultVariant: "off",
    variants: ["off", "on"]
  },
  {
    key: "voice.calibrationWizardV1",
    scope: "content",
    enabled: true,
    description: "Wizard-based voice calibration (replaces legacy example import)",
    defaultVariant: "on",
    variants: ["off", "on"]
  },
  {
    key: "rollout.beta.access",
    scope: "rollout",
    enabled: false,
    defaultVariant: "control",
    variants: ["control", "beta"],
    rollout: {
      percentage: 0,
      stickyBy: "userId",
      allowedVariants: ["control", "beta"]
    }
  }
];
