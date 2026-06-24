import { Effect } from "effect";
import type {
  AsyncRunResponse,
  ExecutionVoiceMetadataView,
  PipelineRequest,
  RunResponse
} from "@my-ai-orchestrator/contracts";
import type { CorpusManager, MemoryManager } from "@my-ai-orchestrator/core";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { BackendConfig } from "../config/config.js";
import type {
  BackendAIPolicyCatalogError,
  BackendExecutionConflictError,
  BackendExecutionFailedError,
  BackendExecutionIntegrityError,
  BackendUsageAuthorizationError
} from "../http/errors.js";
import type { ResolvedExecutionSnapshot, ResolvedPricingEnvelope } from "../product/ai-policy/ai-policy-types.js";
import type { BackendQueuedJob } from "../jobs/worker.js";
import type { BackendProductServices } from "../product.js";
import type { BackendProviderTransport } from "./pipeline/provider-transport.js";

import type { DurableJobRuntime } from "../runtime/durable-job-runtime.js";
import type { ExecutionIdempotencyStore } from "./idempotency-store.js";

export interface BackendExecutionOptions {
  readonly config: BackendConfig;
  readonly jobStore: BackendJobStoreLike;
  readonly logger?: AppLogger;
  readonly now: () => Date;
  readonly services: BackendProductServices;
  readonly providerTransport?: BackendProviderTransport;
  readonly memory?: MemoryManager<DatabaseError>;
  readonly corpus?: CorpusManager;
  readonly onQueuedJob?: (job: BackendQueuedJob) => void;
  readonly durableEnqueue?: DurableJobRuntime["enqueueAtomic"];
  readonly runtimeMode?: "durable" | "memory";
  readonly idempotencyStore?: ExecutionIdempotencyStore;
  readonly voice?: ExecutionVoiceMetadataView;
}

export interface BackendExecutionService {
  readonly execute: (
    request: PipelineRequest
  ) => Effect.Effect<
    RunResponse,
    BackendExecutionConflictError | BackendExecutionFailedError | BackendUsageAuthorizationError | BackendAIPolicyCatalogError | DatabaseError
  >;
  readonly executeTrusted: (
    snapshot: ResolvedExecutionSnapshot,
    options?: {
      readonly simulateCredits?: boolean;
    }
  ) => Effect.Effect<
    RunResponse,
    | BackendExecutionConflictError
    | BackendExecutionFailedError
    | BackendExecutionIntegrityError
    | BackendUsageAuthorizationError
    | DatabaseError
  >;
}

export interface CachedExecution {
  readonly fingerprint: string;
  readonly response: RunResponse;
}

export interface BackendJobStoreLike {
  readonly createQueuedJob: (
    request: PipelineRequest,
    options?: {
      readonly createdAt?: string;
      readonly contentType?: string;
      readonly estimatedSteps?: number;
      readonly voice?: ExecutionVoiceMetadataView;
    }
  ) => Effect.Effect<AsyncRunResponse, DatabaseError>;
}

export interface PreparedExecution {
  readonly request: PipelineRequest;
  readonly plan: import("@my-ai-orchestrator/orchestrator").OrchestrationPlan;
  readonly pricingEnvelope?: ResolvedPricingEnvelope;
  readonly simulateCredits?: boolean;
}
