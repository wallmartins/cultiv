import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type {
  ConfirmWizardReviewInput,
  SetWizardContextInput,
  SubmitWizardStepInput,
  VoiceCalibrationEntitlementView,
  VoiceCalibrationSessionView,
  VoiceCalibrationStepPromptView,
  WizardContext
} from "@my-ai-orchestrator/contracts";
import type { WizardStepId } from "@my-ai-orchestrator/domain";
import type {
  BackendVoiceCalibrationSessionNotFoundError,
  BackendVoiceCalibrationValidationError,
  BackendVoiceTrainingConsentFailureError,
  BackendVoiceTrainingConsentRequiredError
} from "../../http/errors.js";

export interface BackendVoiceCalibrationService {
  readonly startSession: (
    userId: string
  ) => Effect.Effect<
    VoiceCalibrationSessionView,
    BackendVoiceCalibrationValidationError | BackendVoiceTrainingConsentRequiredError | BackendVoiceTrainingConsentFailureError
  >;
  readonly setContext: (
    sessionId: string,
    userId: string,
    context: SetWizardContextInput
  ) => Effect.Effect<
    VoiceCalibrationSessionView,
    | BackendVoiceCalibrationSessionNotFoundError
    | BackendVoiceCalibrationValidationError
  >;
  readonly getSession: (
    sessionId: string,
    userId: string
  ) => Effect.Effect<VoiceCalibrationSessionView, BackendVoiceCalibrationSessionNotFoundError>;
  readonly getStepPrompt: (
    sessionId: string,
    userId: string,
    stepId: WizardStepId
  ) => Effect.Effect<
    VoiceCalibrationStepPromptView,
    BackendVoiceCalibrationSessionNotFoundError | BackendVoiceCalibrationValidationError
  >;
  readonly submitStep: (
    sessionId: string,
    userId: string,
    input: SubmitWizardStepInput
  ) => Effect.Effect<
    VoiceCalibrationSessionView,
    | BackendVoiceCalibrationSessionNotFoundError
    | BackendVoiceCalibrationValidationError
    | DatabaseError
    | BackendVoiceTrainingConsentRequiredError
    | BackendVoiceTrainingConsentFailureError
  >;
  readonly skipStep: (
    sessionId: string,
    userId: string,
    stepId: WizardStepId
  ) => Effect.Effect<
    VoiceCalibrationSessionView,
    BackendVoiceCalibrationSessionNotFoundError | BackendVoiceCalibrationValidationError
  >;
  readonly completeReview: (
    sessionId: string,
    userId: string,
    input: ConfirmWizardReviewInput
  ) => Effect.Effect<
    VoiceCalibrationSessionView,
    | BackendVoiceCalibrationSessionNotFoundError
    | BackendVoiceCalibrationValidationError
    | DatabaseError
  >;
  readonly getEntitlement: (userId: string) => Effect.Effect<VoiceCalibrationEntitlementView>;
}

export type { WizardContext };
