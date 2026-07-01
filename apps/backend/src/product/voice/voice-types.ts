import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type {
  ExecutionVoiceMetadataView,
  TraitConfirmationInput,
  VoiceExampleCreateInput,
  VoiceExampleListItemView,
  VoiceExamplesPageView,
  VoiceExampleUpdateInput,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView
} from "@my-ai-orchestrator/contracts";
import type {
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
  readonly getProfileScreen: (userId: string) => Effect.Effect<VoiceProfileScreenView | undefined, DatabaseError>;
  readonly recordTraitConfirmation: (
    userId: string,
    input: TraitConfirmationInput
  ) => Effect.Effect<VoiceProfileDiagnosticsView | undefined, DatabaseError>;
  readonly resolveEffectiveVoice: (
    userId: string,
    context: EffectiveVoiceContext
  ) => Effect.Effect<EffectiveVoiceResolution | undefined, DatabaseError>;
  readonly listExamples: (
    userId: string,
    options?: ListVoiceExamplesOptions
  ) => Effect.Effect<VoiceExamplesPageView, DatabaseError>;
  readonly createExample: (
    userId: string,
    input: VoiceExampleCreateInput
  ) => Effect.Effect<
    VoiceExampleListItemView,
    | VoiceExampleValidationError
    | VoicePinnedLimitExceededError
    | BackendVoiceTrainingConsentRequiredError
    | BackendVoiceTrainingConsentFailureError
    | DatabaseError
  >;
  readonly updateExample: (
    userId: string,
    exampleId: string,
    input: VoiceExampleUpdateInput
  ) => Effect.Effect<
    VoiceExampleListItemView | undefined,
    | VoiceExampleValidationError
    | VoicePinnedLimitExceededError
    | BackendVoiceTrainingConsentRequiredError
    | BackendVoiceTrainingConsentFailureError
    | DatabaseError
  >;
}

export interface EffectiveVoiceContext {
  readonly contentType: string;
  readonly requestedLanguage?: string;
}

export interface EffectiveVoiceResolution {
  readonly voiceHints: Partial<import("@my-ai-orchestrator/text-quality").VoiceProfile>;
  readonly metadata: ExecutionVoiceMetadataView;
}
