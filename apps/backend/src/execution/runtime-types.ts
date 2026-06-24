import type { JobProgress, PipelineRequest, SyncRunResponse } from "@my-ai-orchestrator/contracts";
import type { CorpusManager, MemoryManager } from "@my-ai-orchestrator/core";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BackendConfig } from "../config/config.js";
import type { BackendProductServices } from "../product.js";
import type { ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import type { EffectiveVoiceResolution } from "../product/voice/voice-types.js";
import type { BackendProviderTransport } from "./pipeline/provider-transport.js";

export interface ExecutePipelineOptions {
  readonly plan: OrchestrationPlan;
  readonly request: PipelineRequest;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
  readonly config: BackendConfig;
  readonly now: () => Date;
  readonly includeTrace: boolean;
  readonly services: BackendProductServices;
  readonly providerTransport?: BackendProviderTransport;
  readonly memory?: MemoryManager<DatabaseError>;
  readonly corpus?: CorpusManager;
  readonly onProgress?: (progress: JobProgress) => void;
  readonly existingCreditReservationId?: string;
}

export interface RuntimeSelectionContext {
  readonly billingIdentity: ReturnType<typeof import("./billing.js").resolveBackendBillingIdentity>;
  readonly selection: ReturnType<typeof import("./quality/quality.js").resolveSelection>;
  readonly controls: ReturnType<typeof import("./quality/quality.js").createExecutionControls>;
  readonly attempts: readonly ("fast" | "balanced" | "strict")[];
  readonly billingEnabled: boolean;
  readonly debitedCreditsEstimate: number;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly refinementEnabled: boolean;
  readonly voice?: EffectiveVoiceResolution;
}

export interface RuntimeAttemptState {
  readonly lastResult?: SyncRunResponse;
  readonly lastScore: number;
  readonly executedLLMCalls: number;
}
