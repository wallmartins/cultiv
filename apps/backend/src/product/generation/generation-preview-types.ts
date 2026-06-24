import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type { GenerationPreviewRequest, GenerationPreviewResponse } from "@my-ai-orchestrator/contracts";
import type {
  BackendAIPolicyCatalogError,
  BackendAIPolicyPricingError,
  BackendInputSafetyGatewayFailureError,
  BackendInputSafetyPolicyError,
  BackendSafetyPolicyDefinitionError,
  BackendValidationError
} from "../../http/errors.js";
import type { SanitizedGenerationPreviewRequest } from "../../safety/public-input-safety-types.js";

export interface BackendGenerationPreviewService {
  readonly preview: (
    args: BackendGenerationPreviewRequest
  ) => Effect.Effect<
    GenerationPreviewResponse,
    | BackendAIPolicyCatalogError
    | BackendAIPolicyPricingError
    | BackendInputSafetyGatewayFailureError
    | BackendInputSafetyPolicyError
    | BackendSafetyPolicyDefinitionError
    | BackendValidationError
    | DatabaseError
  >;
}

export interface BackendGenerationPreviewRequest extends GenerationPreviewRequest {
  readonly userId: string;
}

export type BackendApprovedGenerationPreviewRequest = SanitizedGenerationPreviewRequest;
