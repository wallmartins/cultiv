import { Context, Effect, Layer } from "effect";
import type { PipelineDefinition, PipelineRequest, PipelineType, QualityMode } from "@my-ai-orchestrator/contracts";
import type { OrchestrationCatalog } from "@my-ai-orchestrator/orchestrator";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { ExecutionMode } from "@my-ai-orchestrator/contracts";
import type {
  BackendAIPolicyCatalogError,
  BackendAIPolicyLoadError,
  BackendAIPolicyPricingError,
  BackendAIPolicyValidationError
} from "../../http/errors.js";

export type AIPolicyLifecycle = "active" | "legacy-supported";
export type StepExecutionType = "local" | "llm";
export type BillingPlanTier = "free" | "starter" | "pro" | "enterprise";

export interface AIPolicyStepDefinition {
  readonly name: string;
  readonly skill: string;
  readonly execution: StepExecutionType;
  readonly routingProfile?: string;
  readonly override?: {
    readonly from: "local";
    readonly to: "llm";
    readonly reason: string;
  };
}

export interface AIPolicyPipelineDefinition {
  readonly pipelineType: PipelineType;
  readonly contentType: string;
  readonly defaultLanguage: string;
  readonly defaultQualityMode: QualityMode;
  readonly steps: readonly AIPolicyStepDefinition[];
}

export interface AIPolicyContentTypeDefinition {
  readonly id: string;
  readonly label: string;
  readonly defaultLanguage: string;
  readonly pipelineType: PipelineType;
  readonly internal?: boolean;
}

export interface AIPolicyProviderModelAttempt {
  readonly provider: string;
  readonly model: string;
  readonly timeoutMs?: number;
}

export type AIPolicyRoutingFallbackCondition =
  | "transport_error"
  | "timeout"
  | "invalid_request"
  | "invalid_response"
  | "provider_unavailable";

export interface AIPolicyRoutingProfileDefinition {
  readonly id: string;
  readonly preferredAttempts: readonly AIPolicyProviderModelAttempt[];
  readonly fallbackAttempts: readonly AIPolicyProviderModelAttempt[];
  readonly operationalConstraints: {
    readonly fallbackOn: readonly AIPolicyRoutingFallbackCondition[];
  };
}

export interface ResolvedPricingEnvelope {
  readonly policyVersion: string;
  readonly lifecycle: AIPolicyLifecycle;
  readonly planTier: BillingPlanTier;
  readonly contentType: string;
  readonly qualityMode: QualityMode;
  readonly creditPrice: number;
  readonly planSignature?: import("@my-ai-orchestrator/contracts").PlanSignature;
  readonly lengthTier?: import("@my-ai-orchestrator/contracts").GenerationLengthTier;
}

export interface ResolvedExecutionStep {
  readonly name: string;
  readonly skill: string;
  readonly execution: StepExecutionType;
  readonly routingProfile?: string;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly fallbackOn: readonly AIPolicyRoutingFallbackCondition[];
}

export interface ResolvedExecutionSnapshot {
  readonly policyVersion: string;
  readonly lifecycle: AIPolicyLifecycle;
  readonly planTier: BillingPlanTier;
  readonly request: PipelineRequest;
  readonly plan: OrchestrationPlan;
  readonly pricingEnvelope: ResolvedPricingEnvelope;
  readonly steps: readonly ResolvedExecutionStep[];
}

export interface ResolvedAIPolicyVersion {
  readonly version: string;
  readonly lifecycle: AIPolicyLifecycle;
  readonly catalog: Readonly<Record<PipelineType, AIPolicyPipelineDefinition>>;
  readonly contentTypes: Readonly<Record<string, AIPolicyContentTypeDefinition>>;
  readonly routingProfiles: Readonly<Record<string, AIPolicyRoutingProfileDefinition>>;
  readonly orchestrationCatalog: OrchestrationCatalog;
}

export interface ActivePolicyPointerRecord {
  readonly activePolicyVersion: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly history: readonly {
    readonly policyVersion: string;
    readonly updatedAt: string;
    readonly updatedBy: string;
  }[];
}

export interface BackendAIPolicyVersionSummary {
  readonly version: string;
  readonly lifecycle: AIPolicyLifecycle;
}

export interface BackendAIPolicyDegradationRecommendation {
  readonly recommendedPolicyVersion: string;
  readonly reason: string;
  readonly evidence: {
    readonly degradedProvider: string;
    readonly failureCount: number;
    readonly observedAt: string;
  };
}

export interface BackendAIPolicyServiceContract {
  readonly getActivePolicy: () => Effect.Effect<ResolvedAIPolicyVersion, never>;
  readonly getActivePolicyPointer: () => Effect.Effect<ActivePolicyPointerRecord, never>;
  readonly getActiveOrchestrationCatalog: () => OrchestrationCatalog;
  readonly listPolicyVersions: () => readonly BackendAIPolicyVersionSummary[];
  readonly activatePolicyVersion: (args: {
    readonly policyVersion: string;
    readonly actor: string;
    readonly approvedAt?: string;
  }) => Effect.Effect<ActivePolicyPointerRecord, BackendAIPolicyPricingError>;
  readonly reloadActivePolicyPointer: () => Effect.Effect<ActivePolicyPointerRecord, BackendAIPolicyPricingError>;
  readonly recordDegradationSignal: (args: {
    readonly policyVersion: string;
    readonly provider: string;
    readonly occurredAt: string;
    readonly failureCount: number;
  }) => Effect.Effect<void, never>;
  readonly recommendFuturePolicyVersion: () => Effect.Effect<BackendAIPolicyDegradationRecommendation | undefined, never>;
  readonly listContentTypes: () => readonly AIPolicyContentTypeDefinition[];
  readonly validatePipelineRequest: (
    request: PipelineRequest
  ) => Effect.Effect<void, BackendAIPolicyCatalogError>;
  readonly resolvePricingEnvelope: (
    args: {
      readonly planTier: BillingPlanTier;
      readonly contentType: string;
      readonly qualityMode: QualityMode;
      readonly planSignature?: import("@my-ai-orchestrator/contracts").PlanSignature;
      readonly lengthTier?: import("@my-ai-orchestrator/contracts").GenerationLengthTier;
      readonly attachedPolicyVersion?: string;
    }
  ) => Effect.Effect<ResolvedPricingEnvelope, BackendAIPolicyCatalogError | BackendAIPolicyPricingError>;
  readonly resolveExecutionSnapshot: (
    args: {
      readonly request: PipelineRequest;
      readonly planTier: BillingPlanTier;
      readonly executionMode: ExecutionMode;
      readonly qualityMode: QualityMode;
      readonly defaultLanguage: string;
      readonly attachedPolicyVersion?: string;
    }
  ) => Effect.Effect<
    ResolvedExecutionSnapshot,
    BackendAIPolicyCatalogError | BackendAIPolicyPricingError
  >;
}

export type BackendAIPolicyBootstrapError =
  | BackendAIPolicyLoadError
  | BackendAIPolicyValidationError
  | BackendAIPolicyCatalogError;

export class BackendAIPolicyServiceTag extends Context.Tag("BackendAIPolicyService")<
  BackendAIPolicyServiceTag,
  BackendAIPolicyServiceContract
>() {}

export const createBackendAIPolicyLayer = (service: BackendAIPolicyServiceContract) =>
  Layer.succeed(BackendAIPolicyServiceTag, service);
