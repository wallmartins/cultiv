import type { ExecutionMode } from "@my-ai-orchestrator/contracts";
import { createFeatureFlagEvaluator } from "./evaluator.js";
import type { FeatureFlagEvaluationContext, FeatureFlagRegistry, ResolvedFeatureFlag } from "./types.js";

export function resolveExecutionModeFlag(
  registry: FeatureFlagRegistry,
  context: FeatureFlagEvaluationContext = {}
): ExecutionMode {
  return registry.resolve("execution.sync_mode")?.enabled ? "sync" : "async";
}

export function resolveContentRefinementFlag(
  registry: FeatureFlagRegistry,
  context: FeatureFlagEvaluationContext = {}
): boolean {
  return createFeatureFlagEvaluator(registry).isEnabled("content.language.refinement", context);
}

export function resolveRolloutFlag(
  registry: FeatureFlagRegistry,
  key: string,
  context: FeatureFlagEvaluationContext = {}
): ResolvedFeatureFlag {
  return createFeatureFlagEvaluator(registry).resolve(key, context);
}
