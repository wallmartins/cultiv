import { Effect } from "effect";
import { BackendAIPolicyPricingError } from "../../http/errors.js";
import type { ResolvedVersionDocument } from "./ai-policy-loader.js";
import { createActivePolicyPointerController } from "./ai-policy-active-pointer.js";
import { validatePipelineRequestAgainstPolicy } from "./ai-policy-pipeline-validation.js";
import {
  resolvePolicyExecutionSnapshot,
  resolvePolicyPricing
} from "./ai-policy-resolution.js";
import type { BackendAIPolicyServiceContract } from "./ai-policy-types.js";
import {
  createResolvedPolicyVersionIndex,
  resolvePolicyVersion
} from "./ai-policy-version-index.js";

export function createBackendAIPolicyService(options: {
  readonly activePolicy: ResolvedVersionDocument;
  readonly versionIndex: ReadonlyMap<string, ResolvedVersionDocument>;
  readonly attachedPolicyVersion?: string;
  readonly database: import("@my-ai-orchestrator/database").DatabaseClient;
  readonly namespace: string;
  readonly now: () => Date;
  readonly reloadIntervalMs?: number;
}): Effect.Effect<BackendAIPolicyServiceContract, never> {
  const index = createResolvedPolicyVersionIndex({
    activePolicy: options.activePolicy,
    versionIndex: options.versionIndex
  });

  return Effect.gen(function* () {
    const pointer = yield* createActivePolicyPointerController({
      database: options.database,
      namespace: options.namespace,
      defaultPolicyVersion: options.activePolicy.version,
      now: options.now,
      reloadIntervalMs: Math.max(0, options.reloadIntervalMs ?? 1_000)
    });

    const resolveSelectedPolicyVersion = () =>
      Effect.gen(function* () {
        const currentPointer = yield* pointer.ensureFreshPointer();
        return options.attachedPolicyVersion ?? currentPointer.activePolicyVersion;
      });

    const resolveActivePolicy = () =>
      Effect.gen(function* () {
        const selectedPolicyVersion = yield* resolveSelectedPolicyVersion();
        return yield* resolvePolicyVersion(index, selectedPolicyVersion, {
          planTier: "system",
          contentType: "system",
          qualityMode: "system"
        });
      }).pipe(Effect.orDie);

    return {
      getActivePolicy: () => resolveActivePolicy(),
      getActivePolicyPointer: () => pointer.ensureFreshPointer(),
      getActiveOrchestrationCatalog: () => {
        const selectedPolicyVersion = options.attachedPolicyVersion ?? pointer.getCurrentPointer().activePolicyVersion;
        return (index.versions.get(selectedPolicyVersion) ?? index.fallbackPolicy).orchestrationCatalog;
      },
      listPolicyVersions: () => [...index.versionSummaries],
      activatePolicyVersion: (args) =>
        Effect.gen(function* () {
          yield* resolvePolicyVersion(index, args.policyVersion, {
            planTier: "system",
            contentType: "system",
            qualityMode: "system"
          }).pipe(
            Effect.mapError(
              (error) =>
                new BackendAIPolicyPricingError({
                  ...error,
                  message: `Cannot activate unknown policy version "${args.policyVersion}"`
                })
            )
          );

          return yield* pointer.activatePolicyVersion(args);
        }),
      reloadActivePolicyPointer: () => pointer.reloadPointer(),
      recordDegradationSignal: (args) => pointer.recordDegradationSignal(args),
      recommendFuturePolicyVersion: () =>
        Effect.gen(function* () {
          const selectedPolicyVersion = yield* resolveSelectedPolicyVersion();
          return yield* pointer.recommendFuturePolicyVersion(index.policyVersions, selectedPolicyVersion);
        }),
      listContentTypes: () => {
        const selectedPolicyVersion = options.attachedPolicyVersion ?? pointer.getCurrentPointer().activePolicyVersion;
        return Object.values((index.versions.get(selectedPolicyVersion) ?? index.fallbackPolicy).contentTypes);
      },
      validatePipelineRequest: (request) =>
        Effect.gen(function* () {
          const activePolicy = yield* resolveActivePolicy();
          yield* validatePipelineRequestAgainstPolicy({
            request,
            policy: activePolicy
          });
        }),
      resolvePricingEnvelope: (args) =>
        Effect.gen(function* () {
          const selectedPolicyVersion = args.attachedPolicyVersion
            ?? options.attachedPolicyVersion
            ?? (yield* resolveSelectedPolicyVersion());

          return yield* resolvePolicyPricing({
            index,
            policyVersion: selectedPolicyVersion,
            planTier: args.planTier,
            contentType: args.contentType,
            qualityMode: args.qualityMode
          });
        }),
      resolveExecutionSnapshot: (args) =>
        Effect.gen(function* () {
          const selectedPolicyVersion = args.attachedPolicyVersion
            ?? options.attachedPolicyVersion
            ?? (yield* resolveSelectedPolicyVersion());

          return yield* resolvePolicyExecutionSnapshot({
            index,
            policyVersion: selectedPolicyVersion,
            request: args.request,
            planTier: args.planTier,
            executionMode: args.executionMode,
            qualityMode: args.qualityMode,
            defaultLanguage: args.defaultLanguage
          });
        })
    } satisfies BackendAIPolicyServiceContract;
  });
}
