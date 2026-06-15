import { Effect } from "effect";
import type { MeExecutionRequest, RunResponse } from "@my-ai-orchestrator/contracts";
import type {
  BackendAIPolicyCatalogError,
  BackendAIPolicyPricingError,
  BackendExecutionConflictError,
  BackendExecutionFailedError,
  BackendExecutionIntegrityError,
  BackendInputSafetyGatewayFailureError,
  BackendInputSafetyPolicyError,
  BackendGenerationQuoteMismatchError,
  BackendSafetyPolicyDefinitionError,
  BackendUsageAuthorizationError
} from "../../http/errors.js";

export interface BackendPublicGenerationRequest extends MeExecutionRequest {
  readonly userId: string;
}

export interface BackendPublicGenerationService {
  readonly execute: (
    request: BackendPublicGenerationRequest
  ) => Effect.Effect<
    RunResponse,
    | BackendAIPolicyCatalogError
    | BackendAIPolicyPricingError
    | BackendExecutionConflictError
    | BackendExecutionFailedError
    | BackendExecutionIntegrityError
    | BackendInputSafetyGatewayFailureError
    | BackendInputSafetyPolicyError
    | BackendGenerationQuoteMismatchError
    | BackendSafetyPolicyDefinitionError
    | BackendUsageAuthorizationError
  >;
}
