import type { Effect } from "effect";
import type { JobProgress, PipelineRequest } from "@my-ai-orchestrator/contracts";
import type { CorpusManager, MemoryManager } from "@my-ai-orchestrator/core";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { FeatureFlagServiceContract } from "@my-ai-orchestrator/feature-flags";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BackendConfig } from "../../config/config.js";
import type { BackendVoiceService } from "../../product/voice/voice-types.js";
import type { EffectiveVoiceResolution } from "../../product/voice/voice-types.js";
import type { BackendProviderTransport } from "./provider-transport.js";
import type { BackendAIPolicyServiceContract } from "../../product/ai-policy/ai-policy-types.js";
import type { BackendPolicyEvidenceService } from "../../safety/policy-evidence-types.js";
import type { BackendObservabilityService } from "../../product/core/observability-types.js";

export interface ExecutePipelineOptions {
  readonly plan: OrchestrationPlan;
  readonly request: PipelineRequest;
  readonly config: BackendConfig;
  readonly now: () => Date;
  readonly includeTrace: boolean;
  readonly services: {
    readonly aiAdapters: AIAdapterServiceContract;
    readonly aiPolicy: BackendAIPolicyServiceContract;
    readonly voice: BackendVoiceService;
    readonly featureFlags: FeatureFlagServiceContract;
    readonly observability: BackendObservabilityService;
    readonly policyEvidence?: BackendPolicyEvidenceService;
  };
  readonly providerTransport: BackendProviderTransport;
  readonly voice?: EffectiveVoiceResolution;
  readonly memory?: MemoryManager;
  readonly corpus?: CorpusManager;
  readonly onProgress?: (progress: JobProgress) => ProgressCallbackResult;
}

export interface ExecutePipelineAttemptArgs extends ExecutePipelineOptions {
  readonly qualityMode: "fast" | "balanced" | "strict";
  readonly selection: {
    readonly adapter: string;
    readonly model: string;
    readonly qualityMode: "fast" | "balanced" | "strict";
  };
  readonly refinementEnabled: boolean;
  readonly persistMemory?: boolean;
}

export interface BackendAdapterMetrics {
  inputTokensTotal: number;
  outputTokensTotal: number;
  debitedCredits: number;
  estimatedUsdCost: number;
}

export interface BackendProviderAttempt {
  readonly provider: string;
  readonly model: string;
  readonly path: "preferred" | "fallback";
  readonly status: "succeeded" | "failed";
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly estimatedUsdCost?: number;
  readonly debitedCredits?: number;
}

export interface BackendStepProviderAttempt extends BackendProviderAttempt {
  readonly stepIndex: number;
  readonly stepName: string;
}

export interface ExecutePipelineAttemptResult {
  readonly content: string;
  readonly trace: unknown;
  readonly adapter: string;
  readonly model: string;
  readonly attemptsUsed: number;
  readonly metrics: BackendAdapterMetrics;
  readonly providerAttempts: readonly BackendStepProviderAttempt[];
}

export type ProgressCallbackResult = void | Promise<void> | Effect.Effect<void, never>;
