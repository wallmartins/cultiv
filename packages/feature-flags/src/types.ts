import { Context, Effect } from "effect";
import type { ExecutionMode, PipelineType, QualityMode } from "@my-ai-orchestrator/contracts";
import type { FeatureFlagDefinitionError, FeatureFlagRolloutError, FeatureFlagVariantError } from "./errors.js";

export type FeatureFlagScope = "execution" | "content" | "generation" | "rollout";

export interface FeatureFlagTarget {
  readonly userId?: string;
  readonly pipelineType?: PipelineType;
  readonly contentType?: string;
  readonly environment?: "development" | "test" | "staging" | "production";
  readonly locale?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface FeatureFlagEvaluationContext extends FeatureFlagTarget {
  readonly executionMode?: ExecutionMode;
  readonly qualityMode?: QualityMode;
}

export interface FeatureFlagDefinition {
  readonly key: string;
  readonly scope: FeatureFlagScope;
  readonly enabled: boolean;
  readonly description?: string;
  readonly variants?: readonly string[];
  readonly defaultVariant?: string;
  readonly targets?: readonly FeatureFlagTargetRule[];
  readonly rollout?: FeatureFlagRollout;
}

export interface FeatureFlagTargetRule extends FeatureFlagTarget {
  readonly enabled?: boolean;
  readonly variant?: string;
}

export interface FeatureFlagRollout {
  readonly percentage?: number;
  readonly stickyBy?: "userId" | "contentType" | "pipelineType" | "locale";
  readonly allowedVariants?: readonly string[];
}

export interface ResolvedFeatureFlag {
  readonly key: string;
  readonly scope: FeatureFlagScope;
  readonly enabled: boolean;
  readonly variant: string | null;
  readonly reason: "default" | "target" | "rollout" | "disabled";
  readonly target: FeatureFlagTarget;
}

export interface FeatureFlagRegistry {
  readonly register: (flag: FeatureFlagDefinition) => Effect.Effect<void, FeatureFlagError>;
  readonly resolve: (key: string) => FeatureFlagDefinition | undefined;
  readonly list: () => readonly FeatureFlagDefinition[];
  readonly snapshot: () => Readonly<Record<string, FeatureFlagDefinition>>;
}

export interface FeatureFlagEvaluator {
  readonly resolve: (key: string, context?: FeatureFlagEvaluationContext) => ResolvedFeatureFlag;
  readonly isEnabled: (key: string, context?: FeatureFlagEvaluationContext) => boolean;
  readonly getVariant: (key: string, context?: FeatureFlagEvaluationContext) => string | null;
}

export interface FeatureFlagProvider {
  readonly load: () => Effect.Effect<readonly FeatureFlagDefinition[], FeatureFlagError>;
}

export interface FeatureFlagServiceContract {
  readonly resolve: (key: string, context?: FeatureFlagEvaluationContext) => ResolvedFeatureFlag;
  readonly isEnabled: (key: string, context?: FeatureFlagEvaluationContext) => boolean;
  readonly getVariant: (key: string, context?: FeatureFlagEvaluationContext) => string | null;
  readonly refresh: () => Effect.Effect<void, FeatureFlagError>;
}

export interface FeatureFlagsOptions {
  readonly provider?: FeatureFlagProvider;
  readonly registry?: FeatureFlagRegistry;
}

export class FeatureFlagRegistryService extends Context.Tag("FeatureFlagRegistryService")<
  FeatureFlagRegistryService,
  FeatureFlagRegistry
>() {}

export class FeatureFlagEvaluatorService extends Context.Tag("FeatureFlagEvaluatorService")<
  FeatureFlagEvaluatorService,
  FeatureFlagEvaluator
>() {}

export class FeatureFlagService extends Context.Tag("FeatureFlagService")<
  FeatureFlagService,
  FeatureFlagServiceContract
>() {}

export type FeatureFlagError =
  | FeatureFlagDefinitionError
  | FeatureFlagRolloutError
  | FeatureFlagVariantError;
