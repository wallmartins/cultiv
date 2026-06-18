export { FeatureFlagDefinitionError, FeatureFlagRolloutError, FeatureFlagVariantError } from "./errors.js";

export { DEFAULT_FEATURE_FLAGS } from "./defaults.js";

export type {
  FeatureFlagScope,
  FeatureFlagTarget,
  FeatureFlagEvaluationContext,
  FeatureFlagDefinition,
  FeatureFlagTargetRule,
  FeatureFlagRollout,
  ResolvedFeatureFlag,
  FeatureFlagRegistry,
  FeatureFlagEvaluator,
  FeatureFlagProvider,
  FeatureFlagServiceContract,
  FeatureFlagsOptions,
  FeatureFlagError
} from "./types.js";

export {
  FeatureFlagRegistryService,
  FeatureFlagEvaluatorService,
  FeatureFlagService
} from "./types.js";

export { createFeatureFlagRegistry, listFeatureFlagKeys } from "./registry.js";

export { createFeatureFlagEvaluator } from "./evaluator.js";

export {
  createFeatureFlagService,
  createFeatureFlagRegistryLayer,
  createFeatureFlagEvaluatorLayer,
  createFeatureFlagServiceLayer,
  withFeatureFlags,
  createFeatureFlagProvider
} from "./service.js";

export { validateFeatureFlag, defineFeatureFlag } from "./validation.js";

export {
  resolveExecutionModeFlag,
  resolveContentRefinementFlag,
  resolveRolloutFlag
} from "./domain-helpers.js";
