import { Effect } from "effect";
import type {
  BillingEntitlement
} from "@my-ai-orchestrator/payments";
import type {
  PipelineRequest,
  QualityMode
} from "@my-ai-orchestrator/contracts";
import type { OrchestrationPlan } from "@my-ai-orchestrator/orchestrator";
import type { BackendUsageAuthorizationError } from "../../http/errors.js";

export interface BackendUsagePolicy {
  readonly authorize: (args: BackendUsageAuthorizationRequest) => Effect.Effect<
    BackendUsageAuthorization,
    BackendUsageAuthorizationError
  >;
}

export interface BackendUsageAuthorizationRequest {
  readonly request: PipelineRequest;
  readonly plan: OrchestrationPlan;
  readonly executionMode: "sync" | "async";
  readonly qualityMode: QualityMode;
  readonly userId: string;
  readonly planId: string;
  readonly model: string;
  readonly adapter: string;
}

export interface BackendUsageAuthorization {
  readonly userId: string;
  readonly planId: string;
  readonly executionMode: "sync" | "async";
  readonly qualityMode: QualityMode;
  readonly trafficWindow: string;
  readonly trafficLimit: number | null;
  readonly trafficUsed: number;
  readonly modelAllowed: boolean;
  readonly refinementEnabled: boolean;
  readonly betaEnabled: boolean;
  readonly entitlement: BillingEntitlement | null;
}
