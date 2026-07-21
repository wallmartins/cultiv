import { buildOrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { PipelineStepDefinition } from "@my-ai-orchestrator/contracts";
import type {
  BackendAIPolicyCatalogError,
  BackendAIPolicyPricingError
} from "../../http/errors.js";
import { BackendAIPolicyCatalogError as BackendAIPolicyCatalogFailure } from "../../http/errors.js";
import type {
  AIPolicyPipelineDefinition,
  BillingPlanTier,
  ExecutionEntryInput,
  ResolvedAIPolicyVersion,
  ResolvedExecutionSnapshot,
  ResolvedExecutionStep,
  AIPolicyProviderModelAttempt,
  ResolvedPricingEnvelope,
  StepExecutionType
} from "./ai-policy-types.js";
import { Effect } from "effect";

function isExplicitPipelineRequest(
  request: import("@my-ai-orchestrator/contracts").PipelineRequest
): request is import("@my-ai-orchestrator/contracts").ExplicitPipelineRequest {
  return "pipeline" in request;
}

function readStepConfigString(
  config: Readonly<Record<string, unknown>> | undefined,
  key: string
): string | undefined {
  const value = config?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function resolveExplicitPlanStep(
  policy: ResolvedAIPolicyVersion,
  step: PipelineStepDefinition,
  pipelinePolicy: AIPolicyPipelineDefinition
): ResolvedExecutionStep {
  const catalogStep = pipelinePolicy.steps.find((candidate) => candidate.name === step.name);
  const configExecution = readStepConfigString(step.config, "executionType");
  const execution: StepExecutionType =
    configExecution === "llm" || configExecution === "local"
      ? configExecution
      : (catalogStep?.execution ?? "local");
  const routingProfile =
    readStepConfigString(step.config, "routingProfile") ?? catalogStep?.routingProfile;

  return {
    name: step.name,
    skill: step.skill,
    execution,
    routingProfile,
    attempts: resolveStepAttempts(policy, routingProfile),
    fallbackOn: resolveStepFallbackConditions(policy, routingProfile)
  };
}

export function resolveExecutionSnapshot(args: {
  readonly policy: ResolvedAIPolicyVersion;
  readonly pricingEnvelope: ResolvedPricingEnvelope;
  readonly request: ExecutionEntryInput;
  readonly planTier: BillingPlanTier;
  readonly executionMode: import("@my-ai-orchestrator/contracts").ExecutionMode;
  readonly qualityMode: import("@my-ai-orchestrator/contracts").QualityMode;
  readonly defaultLanguage: string;
}): Effect.Effect<
  ResolvedExecutionSnapshot,
  BackendAIPolicyCatalogError | BackendAIPolicyPricingError
> {
  return Effect.gen(function* () {
    const plan = buildOrchestrationPlan(args.request, {
      catalog: args.policy.orchestrationCatalog,
      executionMode: args.executionMode,
      qualityMode: args.qualityMode,
      defaultLanguage: args.defaultLanguage
    });
    const pipelinePolicy = args.policy.catalog[plan.pipelineType ?? inferPlanSignature(plan.pipeline.name)];

    if (!pipelinePolicy) {
      return yield* Effect.fail(
        new BackendAIPolicyCatalogFailure({
          policyVersion: args.policy.version,
          pipelineName: plan.pipeline.name,
          message: `Pipeline "${plan.pipeline.name}" is not available in policy version "${args.policy.version}"`
        })
      );
    }

    const explicitPipeline = isExplicitPipelineRequest(args.request);
    const steps = explicitPipeline
      ? plan.pipeline.steps.map((step) => resolveExplicitPlanStep(args.policy, step, pipelinePolicy))
      : pipelinePolicy.steps.map<ResolvedExecutionStep>((step) => ({
          name: step.name,
          skill: step.skill,
          execution: step.execution,
          routingProfile: step.routingProfile,
          attempts: resolveStepAttempts(args.policy, step.routingProfile),
          fallbackOn: resolveStepFallbackConditions(args.policy, step.routingProfile)
        }));
    const resolvedPlan = {
      ...plan,
      pipeline: {
        ...plan.pipeline,
        steps: plan.pipeline.steps.map((step, index) => {
          const resolvedStep = steps[index];
          return {
            ...step,
            config: {
              ...(step.config ?? {}),
              executionType: resolvedStep?.execution,
              ...(resolvedStep?.routingProfile ? { routingProfile: resolvedStep.routingProfile } : {}),
              ...(resolvedStep && resolvedStep.execution === "llm"
                ? {
                    resolvedProviderModelPlan: resolvedStep.attempts.map(cloneAttempt),
                    routingConstraints: {
                      fallbackOn: [...resolvedStep.fallbackOn]
                    }
                  }
                : {})
            }
          };
        })
      }
    };

    return freezeResolvedExecutionSnapshot({
      policyVersion: args.policy.version,
      lifecycle: args.policy.lifecycle,
      planTier: args.planTier,
      request: args.request,
      plan: resolvedPlan,
      pricingEnvelope: args.pricingEnvelope,
      steps
    });
  });
}

function resolveStepAttempts(
  policy: ResolvedAIPolicyVersion,
  routingProfile: string | undefined
): readonly AIPolicyProviderModelAttempt[] {
  if (!routingProfile) {
    return [];
  }

  const profile = policy.routingProfiles[routingProfile];
  return profile
    ? [...profile.preferredAttempts, ...profile.fallbackAttempts].map(cloneAttempt)
    : [];
}

function resolveStepFallbackConditions(
  policy: ResolvedAIPolicyVersion,
  routingProfile: string | undefined
): ResolvedExecutionStep["fallbackOn"] {
  if (!routingProfile) {
    return [];
  }

  return [...(policy.routingProfiles[routingProfile]?.operationalConstraints.fallbackOn ?? [])];
}

function cloneAttempt(attempt: AIPolicyProviderModelAttempt): AIPolicyProviderModelAttempt {
  return {
    provider: attempt.provider,
    model: attempt.model,
    ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
  };
}

function inferPlanSignature(
  pipelineName: string
): import("@my-ai-orchestrator/contracts").PlanSignature {
  return pipelineName as import("@my-ai-orchestrator/contracts").PlanSignature;
}

function freezeResolvedExecutionSnapshot(snapshot: ResolvedExecutionSnapshot): ResolvedExecutionSnapshot {
  deepFreeze(snapshot);
  return snapshot;
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return;
  }

  Object.freeze(value);

  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
}
