import { Effect } from "effect";
import type {
  ExecutionVoiceMetadataView,
  TraitConfirmationInput,
  VoiceExampleBatchCommitResultView,
  VoiceExampleBatchView,
  VoiceExampleCreateInput,
  VoiceExampleListItemView,
  VoiceExamplesPageView,
  VoiceExampleUpdateInput,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView
} from "@my-ai-orchestrator/contracts";
import type {
  VoiceBatchExpiredError,
  VoiceBatchNotFoundError,
  VoiceExampleValidationError,
  VoicePinnedLimitExceededError
} from "@my-ai-orchestrator/domain";
import type {
  BackendVoiceTrainingConsentFailureError,
  BackendVoiceTrainingConsentRequiredError
} from "../../http/errors.js";

export interface ListVoiceExamplesOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly state?: "active" | "excluded";
  readonly pinned?: boolean;
  readonly contentType?: string;
}

export interface BackendVoiceService {
  readonly getProfileScreen: (userId: string) => Effect.Effect<VoiceProfileScreenView | undefined>;
  readonly recordTraitConfirmation: (
    userId: string,
    input: TraitConfirmationInput
  ) => Effect.Effect<VoiceProfileDiagnosticsView | undefined>;
  readonly resolveEffectiveVoice: (
    userId: string,
    context: EffectiveVoiceContext
  ) => Effect.Effect<EffectiveVoiceResolution | undefined>;
  readonly listExamples: (
    userId: string,
    options?: ListVoiceExamplesOptions
  ) => Effect.Effect<VoiceExamplesPageView>;
  readonly createExample: (
    userId: string,
    input: VoiceExampleCreateInput
  ) => Effect.Effect<
    VoiceExampleListItemView,
    VoiceExampleValidationError | VoicePinnedLimitExceededError | BackendVoiceTrainingConsentRequiredError | BackendVoiceTrainingConsentFailureError
  >;
  readonly updateExample: (
    userId: string,
    exampleId: string,
    input: VoiceExampleUpdateInput
  ) => Effect.Effect<
    VoiceExampleListItemView | undefined,
    VoiceExampleValidationError | VoicePinnedLimitExceededError | BackendVoiceTrainingConsentRequiredError | BackendVoiceTrainingConsentFailureError
  >;
  readonly createBatch: (
    userId: string,
    options?: {
      readonly expiresAt?: string;
    }
  ) => Effect.Effect<VoiceExampleBatchView>;
  readonly addBatchItems: (
    userId: string,
    batchId: string,
    items: readonly VoiceExampleBatchInput[]
  ) => Effect.Effect<
    VoiceExampleBatchView,
    VoiceBatchNotFoundError | VoiceBatchExpiredError
  >;
  readonly commitBatch: (
    userId: string,
    batchId: string
  ) => Effect.Effect<
    VoiceExampleBatchCommitResultView,
    VoiceBatchNotFoundError | VoiceBatchExpiredError | VoiceExampleValidationError | VoicePinnedLimitExceededError | BackendVoiceTrainingConsentRequiredError | BackendVoiceTrainingConsentFailureError
  >;
  readonly autoCommitExpiredBatches: (userId?: string) => Effect.Effect<
    readonly VoiceExampleBatchCommitResultView[],
    VoiceExampleValidationError | VoicePinnedLimitExceededError | BackendVoiceTrainingConsentRequiredError | BackendVoiceTrainingConsentFailureError
  >;
}

export interface VoiceExampleBatchInput {
  readonly clientItemId: string;
  readonly input: VoiceExampleCreateInput;
}

export interface EffectiveVoiceContext {
  readonly contentType: string;
  readonly requestedLanguage?: string;
}

export interface EffectiveVoiceResolution {
  readonly voiceHints: Partial<import("@my-ai-orchestrator/text-quality").VoiceProfile>;
  readonly metadata: ExecutionVoiceMetadataView;
}
