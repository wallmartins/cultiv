import { Context, Effect, Layer } from "effect";
import type { ExecutionMode, PipelineType, QualityMode } from "@my-ai-orchestrator/contracts";
import { FeatureFlagDefinitionError, FeatureFlagRolloutError, FeatureFlagVariantError } from "./errors.js";

export { FeatureFlagDefinitionError, FeatureFlagRolloutError, FeatureFlagVariantError } from "./errors.js";

export type FeatureFlagScope = "execution" | "content" | "rollout";

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
    key: "voice.reasoningSignatureV1",
    scope: "content",
    enabled: false,
    description: "Author reasoning signature extraction, injection, and evaluation",
    defaultVariant: "off",
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

export function createFeatureFlagRegistry(
  initialFlags: readonly FeatureFlagDefinition[] = DEFAULT_FEATURE_FLAGS
): Effect.Effect<FeatureFlagRegistry, FeatureFlagError> {
  const flags = new Map<string, FeatureFlagDefinition>();

  return Effect.gen(function* () {
    for (const flag of initialFlags) {
      const validated = yield* validateFeatureFlag(flag);
      flags.set(validated.key, validated);
    }

    return {
      register(flag) {
        return Effect.map(validateFeatureFlag(flag), (validated) => {
          flags.set(validated.key, validated);
        });
      },
      resolve(key) {
        return flags.get(key);
      },
      list() {
        return Array.from(flags.values());
      },
      snapshot() {
        return Object.fromEntries(flags.entries());
      }
    };
  });
}

export function createFeatureFlagEvaluator(registry: FeatureFlagRegistry): FeatureFlagEvaluator {
  return {
    resolve(key, context = {}) {
      const definition = registry.resolve(key);
      if (!definition) {
        return createMissingFlagResolution(key, context);
      }

      if (!definition.enabled) {
        return {
          key,
          scope: definition.scope,
          enabled: false,
          variant: null,
          reason: "disabled",
          target: context
        };
      }

      const targetMatch = matchTargetRule(definition, context);
      if (targetMatch) {
        return {
          key,
          scope: definition.scope,
          enabled: targetMatch.enabled ?? true,
          variant: targetMatch.variant ?? definition.defaultVariant ?? null,
          reason: "target",
          target: context
        };
      }

      const rolloutMatch = matchRollout(definition, context);
      if (rolloutMatch) {
        return {
          key,
          scope: definition.scope,
          enabled: true,
          variant: rolloutMatch,
          reason: "rollout",
          target: context
        };
      }

      return {
        key,
        scope: definition.scope,
        enabled: true,
        variant: definition.defaultVariant ?? null,
        reason: "default",
        target: context
      };
    },
    isEnabled(key, context) {
      return this.resolve(key, context).enabled;
    },
    getVariant(key, context) {
      return this.resolve(key, context).variant;
    }
  };
}

export function createFeatureFlagService(
  options: FeatureFlagsOptions = {}
): Effect.Effect<FeatureFlagServiceContract, FeatureFlagError> {
  return Effect.gen(function* () {
    const registry = options.registry ? options.registry : yield* createFeatureFlagRegistry();
    const evaluator = createFeatureFlagEvaluator(registry);

    return {
      resolve: evaluator.resolve,
      isEnabled: evaluator.isEnabled,
      getVariant: evaluator.getVariant,
      refresh: () =>
        Effect.gen(function* () {
          if (!options.provider) {
            return;
          }

          const loaded = yield* options.provider.load();
          for (const flag of loaded) {
            yield* registry.register(flag);
          }
        })
    };
  });
}

export function createFeatureFlagRegistryLayer(registry: FeatureFlagRegistry) {
  return Layer.succeed(FeatureFlagRegistryService, registry);
}

export function createFeatureFlagEvaluatorLayer(registry: FeatureFlagRegistry) {
  return Layer.succeed(FeatureFlagEvaluatorService, createFeatureFlagEvaluator(registry));
}

export function createFeatureFlagServiceLayer(options: FeatureFlagsOptions = {}) {
  return Layer.effect(FeatureFlagService, createFeatureFlagService(options));
}

export function withFeatureFlags<T>(effect: Effect.Effect<T>, options: FeatureFlagsOptions = {}) {
  return effect.pipe(Effect.provide(createFeatureFlagServiceLayer(options)));
}

export function createFeatureFlagProvider(flags: readonly FeatureFlagDefinition[]): FeatureFlagProvider {
  return {
    load: () => Effect.succeed(flags)
  };
}

export function defineFeatureFlag(flag: FeatureFlagDefinition): Effect.Effect<FeatureFlagDefinition, FeatureFlagError> {
  return validateFeatureFlag(flag);
}

export function validateFeatureFlag(flag: FeatureFlagDefinition): Effect.Effect<FeatureFlagDefinition, FeatureFlagError> {
  if (!flag || typeof flag !== "object") {
    return Effect.fail(
      new FeatureFlagDefinitionError({
        message: "Feature flag definition is required"
      })
    );
  }

  if (typeof flag.key !== "string" || flag.key.trim().length === 0) {
    return Effect.fail(
      new FeatureFlagDefinitionError({
        message: "Feature flag must have a non-empty key"
      })
    );
  }

  if (flag.variants) {
    const normalized = new Set<string>();
    for (const variant of flag.variants) {
      if (typeof variant !== "string" || variant.trim().length === 0) {
        return Effect.fail(
          new FeatureFlagVariantError({
            key: flag.key,
            message: `Feature flag "${flag.key}" has an invalid variant`
          })
        );
      }
      normalized.add(variant);
    }
    if (flag.defaultVariant && !normalized.has(flag.defaultVariant)) {
      return Effect.fail(
        new FeatureFlagVariantError({
          key: flag.key,
          message: `Feature flag "${flag.key}" defaultVariant must be included in variants`
        })
      );
    }
    if (flag.rollout?.allowedVariants) {
      for (const variant of flag.rollout.allowedVariants) {
        if (!normalized.has(variant)) {
          return Effect.fail(
            new FeatureFlagRolloutError({
              key: flag.key,
              message: `Feature flag "${flag.key}" rollout allowedVariants must be included in variants`
            })
          );
        }
      }
    }
  }

  if (flag.rollout?.percentage !== undefined && (flag.rollout.percentage < 0 || flag.rollout.percentage > 100)) {
    return Effect.fail(
      new FeatureFlagRolloutError({
        key: flag.key,
        message: `Feature flag "${flag.key}" rollout.percentage must be between 0 and 100`
      })
    );
  }

  return Effect.succeed(flag);
}

export function listFeatureFlagKeys(registry: FeatureFlagRegistry): string[] {
  return registry.list().map((flag) => flag.key);
}

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

function createMissingFlagResolution(key: string, context: FeatureFlagEvaluationContext): ResolvedFeatureFlag {
  return {
    key,
    scope: "rollout",
    enabled: false,
    variant: null,
    reason: "disabled",
    target: context
  };
}

function matchTargetRule(
  definition: FeatureFlagDefinition,
  context: FeatureFlagEvaluationContext
): FeatureFlagTargetRule | undefined {
  return definition.targets?.find((rule) => {
    if (rule.environment && rule.environment !== context.environment) {
      return false;
    }
    if (rule.locale && rule.locale !== context.locale) {
      return false;
    }
    if (rule.userId && rule.userId !== context.userId) {
      return false;
    }
    if (rule.pipelineType && rule.pipelineType !== context.pipelineType) {
      return false;
    }
    if (rule.contentType && rule.contentType !== context.contentType) {
      return false;
    }
    if (rule.tags && rule.tags.length > 0) {
      const currentTags = new Set(context.tags ?? []);
      if (!rule.tags.every((tag) => currentTags.has(tag))) {
        return false;
      }
    }
    return true;
  });
}

function matchRollout(definition: FeatureFlagDefinition, context: FeatureFlagEvaluationContext): string | undefined {
  const rollout = definition.rollout;
  if (!rollout || rollout.percentage === undefined || rollout.percentage <= 0) {
    return undefined;
  }

  const basis =
    rollout.stickyBy && context[rollout.stickyBy]
      ? String(context[rollout.stickyBy])
      : JSON.stringify({
          key: definition.key,
          userId: context.userId,
          pipelineType: context.pipelineType,
          contentType: context.contentType,
          locale: context.locale
        });

  const hash = hashString(basis);
  const bucket = hash % 100;
  if (bucket < rollout.percentage) {
    return rollout.allowedVariants?.[1] ?? definition.variants?.[1] ?? definition.defaultVariant ?? "beta";
  }

  return rollout.allowedVariants?.[0] ?? definition.variants?.[0] ?? definition.defaultVariant ?? "control";
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
