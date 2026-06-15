import { Effect } from "effect";
import type {
  BackendOutputReleaseGateFailureError,
  BackendOutputReleasePolicyError
} from "../http/errors.js";
import type { SafetyClassificationCategory } from "../product/safety-policy/safety-policy-types.js";

export interface OutputReleaseFinding {
  readonly category: SafetyClassificationCategory;
  readonly field: string;
  readonly sanitized: boolean;
}

export interface SanitizedGenerationOutput {
  readonly content: string;
}

export interface OutputReleaseApprovedDecision {
  readonly outcome: "approve" | "sanitize";
  readonly sanitizedOutput: SanitizedGenerationOutput;
  readonly findings: readonly OutputReleaseFinding[];
}

export interface OutputReleaseRejectedDecision {
  readonly outcome: "block" | "require_override";
  readonly findings: readonly OutputReleaseFinding[];
}

export type OutputReleaseDecision =
  | OutputReleaseApprovedDecision
  | OutputReleaseRejectedDecision;

export interface BackendOutputReleaseGateService {
  readonly evaluateOutput: (
    output: string,
    context: {
      readonly contentType: string;
      readonly pipelineName: string;
      readonly userId: string;
    }
  ) => Effect.Effect<
    OutputReleaseDecision,
    BackendOutputReleaseGateFailureError
  >;
  readonly authorizeOutput: (
    output: string,
    context: {
      readonly contentType: string;
      readonly pipelineName: string;
      readonly userId: string;
    }
  ) => Effect.Effect<
    SanitizedGenerationOutput,
    BackendOutputReleaseGateFailureError | BackendOutputReleasePolicyError
  >;
}

export interface BackendOutputReleaseGateDependencies {
  readonly safetyPolicy: import("../product/safety-policy-types.js").BackendSafetyPolicyServiceContract;
}
