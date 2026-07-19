import { Effect } from "effect";
import type { PipelineRequest, GenerationPreviewRequest, MeExecutionRequest } from "@my-ai-orchestrator/contracts";
import type {
  BackendInputSafetyGatewayFailureError,
  BackendInputSafetyPolicyError,
  BackendSafetyPolicyDefinitionError
} from "../http/errors.js";
import type { SafetyClassificationCategory } from "../product/safety-policy/safety-policy-types.js";
import type { BackendInstructionOverrideDetector, InstructionOverrideAttemptVerdict } from "./instruction-override-types.js";

export interface SanitizedGenerationInputEnvelope {
  readonly briefing?: string | Record<string, unknown>;
  readonly context?: Record<string, unknown>;
  readonly importedContext?: string;
  readonly inputs?: Record<string, unknown>;
}

// Nominal brands so a raw, unsanitized request is never structurally
// assignable where sanitized or explicitly-trusted input is required.
declare const SanitizedGenerationInputBrand: unique symbol;
export type SanitizedGenerationInput<T> = T & { readonly [SanitizedGenerationInputBrand]: true };

declare const TrustedOperatorInputBrand: unique symbol;
export type TrustedOperatorInput<T> = T & { readonly [TrustedOperatorInputBrand]: true };

// Sole minting point for Trusted Operator Input (see CONTEXT.md). Callers
// must already have enforced operator authorization (role, environment,
// feature flag) before calling this — it performs no checks of its own.
export function mintTrustedOperatorInput<T>(request: T): TrustedOperatorInput<T> {
  return request as TrustedOperatorInput<T>;
}

export interface InputSafetyGatewayFinding {
  readonly category: SafetyClassificationCategory;
  readonly field: string;
  readonly sanitized: boolean;
}

export interface InputSafetyGatewayApprovedDecision {
  readonly outcome: "approve" | "sanitize";
  readonly boundary: "preview" | "generation";
  readonly sanitizedInput: SanitizedGenerationInputEnvelope;
  readonly findings: readonly InputSafetyGatewayFinding[];
  readonly overrideAttempt: InstructionOverrideAttemptVerdict;
}

export interface InputSafetyGatewayRejectedDecision {
  readonly outcome: "quarantine" | "block";
  readonly boundary: "preview" | "generation";
  readonly findings: readonly InputSafetyGatewayFinding[];
  readonly overrideAttempt: InstructionOverrideAttemptVerdict;
}

export type InputSafetyGatewayDecision =
  | InputSafetyGatewayApprovedDecision
  | InputSafetyGatewayRejectedDecision;

export type SanitizedGenerationPreviewRequest = SanitizedGenerationInput<
  Omit<BackendGenerationPreviewGatewayRequest, keyof SanitizedGenerationInputEnvelope>
  & SanitizedGenerationInputEnvelope
>;

export type SanitizedPublicGenerationRequest = SanitizedGenerationInput<
  Omit<BackendPublicGenerationGatewayRequest, keyof SanitizedGenerationInputEnvelope>
  & SanitizedGenerationInputEnvelope
>;

export type SanitizedPipelineRequest = SanitizedGenerationInput<
  Omit<BackendPipelineGatewayRequest, keyof SanitizedGenerationInputEnvelope>
  & SanitizedGenerationInputEnvelope
>;

export type BackendGenerationPreviewGatewayRequest = GenerationPreviewRequest & {
  readonly userId: string;
};

export type BackendPublicGenerationGatewayRequest = MeExecutionRequest & {
  readonly userId: string;
};

export type BackendPipelineGatewayRequest = PipelineRequest & {
  readonly userId: string;
};

export interface BackendPublicInputSafetyGatewayService {
  readonly evaluatePreviewInput: (
    request: BackendGenerationPreviewGatewayRequest
  ) => Effect.Effect<
    InputSafetyGatewayDecision,
    BackendSafetyPolicyDefinitionError | BackendInputSafetyGatewayFailureError
  >;
  readonly evaluateGenerationInput: (
    request: BackendPublicGenerationGatewayRequest | BackendPipelineGatewayRequest
  ) => Effect.Effect<
    InputSafetyGatewayDecision,
    BackendSafetyPolicyDefinitionError | BackendInputSafetyGatewayFailureError
  >;
  readonly authorizePreviewInput: (
    request: BackendGenerationPreviewGatewayRequest
  ) => Effect.Effect<
    SanitizedGenerationPreviewRequest,
    BackendSafetyPolicyDefinitionError | BackendInputSafetyGatewayFailureError | BackendInputSafetyPolicyError
  >;
  readonly authorizeGenerationInput: (
    request: BackendPublicGenerationGatewayRequest | BackendPipelineGatewayRequest
  ) => Effect.Effect<
    SanitizedPublicGenerationRequest | SanitizedPipelineRequest,
    BackendSafetyPolicyDefinitionError | BackendInputSafetyGatewayFailureError | BackendInputSafetyPolicyError
  >;
}

export interface BackendPublicInputSafetyGatewayDependencies {
  readonly safetyPolicy: import("../product/safety-policy/safety-policy-types.js").BackendSafetyPolicyServiceContract;
  readonly instructionOverrideDetector: BackendInstructionOverrideDetector;
}
