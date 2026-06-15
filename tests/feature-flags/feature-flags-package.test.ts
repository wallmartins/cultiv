import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  FeatureFlagService,
  FeatureFlagDefinitionError,
  createFeatureFlagRegistry,
  createFeatureFlagService,
  createFeatureFlagServiceLayer,
  defineFeatureFlag,
  listFeatureFlagKeys,
  resolveContentRefinementFlag,
  resolveExecutionModeFlag,
  resolveRolloutFlag,
  validateFeatureFlag,
  withFeatureFlags
} from "../../packages/feature-flags/src/index.js";

describe("feature-flags package", () => {
  it("validates and registers the default contract", () => {
    const flag = Effect.runSync(defineFeatureFlag({
      key: "execution.sync_mode",
      scope: "execution",
      enabled: true,
      defaultVariant: "sync",
      variants: ["sync", "async"]
    }));

    expect(flag.key).toBe("execution.sync_mode");
    expect(Effect.runSync(validateFeatureFlag(flag)).key).toBe("execution.sync_mode");
  });

  it("resolves target-based and rollout-based flags deterministically", () => {
    const registry = Effect.runSync(createFeatureFlagRegistry([
      {
        key: "content.language.refinement",
        scope: "content",
        enabled: true,
        defaultVariant: "off",
        variants: ["on", "off"],
        targets: [{ environment: "test", enabled: true, variant: "on" }]
      },
      {
        key: "rollout.beta.access",
        scope: "rollout",
        enabled: true,
        defaultVariant: "control",
        variants: ["control", "beta"],
        rollout: {
          percentage: 100,
          stickyBy: "userId",
          allowedVariants: ["control", "beta"]
        }
      }
    ]));

    expect(resolveContentRefinementFlag(registry, { environment: "test" })).toBe(true);
    expect(resolveExecutionModeFlag(registry)).toBe("async");
    expect(resolveRolloutFlag(registry, "rollout.beta.access", { userId: "user_1" }).enabled).toBe(true);
    expect(listFeatureFlagKeys(registry)).toEqual(["content.language.refinement", "rollout.beta.access"]);
  });

  it("refreshes flags through the service contract", async () => {
    const service = Effect.runSync(createFeatureFlagService({
      provider: {
        load: () => Effect.succeed([
          {
            key: "execution.sync_mode",
            scope: "execution",
            enabled: false,
            defaultVariant: "async",
            variants: ["sync", "async"]
          }
        ])
      }
    }));

    expect(service.isEnabled("execution.sync_mode")).toBe(true);
    await Effect.runPromise(service.refresh());
    expect(service.isEnabled("execution.sync_mode")).toBe(false);
  });

  it("provides the flag service through Effect layers", () => {
    const result = Effect.runSync(
      Effect.gen(function* () {
        const service = yield* FeatureFlagService;
        return service.isEnabled("content.language.refinement", { environment: "test" });
      }).pipe(Effect.provide(createFeatureFlagServiceLayer()))
    );

    expect(result).toBe(true);
  });

  it("supports WithFeatureFlags helper", () => {
    const result = Effect.runSync(
      withFeatureFlags(
        Effect.gen(function* () {
          const service = yield* FeatureFlagService;
          return service.getVariant("rollout.beta.access", { userId: "user_1" });
        }),
        {
          registry: Effect.runSync(createFeatureFlagRegistry([
            {
              key: "rollout.beta.access",
              scope: "rollout",
              enabled: true,
              defaultVariant: "control",
              variants: ["control", "beta"]
            }
          ]))
        }
      )
    );

    expect(result).toBe("control");
  });

  it("throws a typed error for invalid definitions", () => {
    const result = Effect.runSync(Effect.either(
      validateFeatureFlag({
        key: "",
        scope: "execution",
        enabled: true,
        variants: ["sync", ""]
      })
    ));
    expect(result._tag).toBe("Left");
    expect(result.left).toBeInstanceOf(FeatureFlagDefinitionError);
  });
});
