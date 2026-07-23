import { Effect } from "effect";
import type { DatabaseError } from "@my-ai-orchestrator/database";
import type {
  ExecutionVoiceMetadataView,
  GenerationChannel,
  TraitConfirmationInput,
  VoiceProfileDiagnosticsView,
  VoiceProfileScreenView
} from "@my-ai-orchestrator/contracts";

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
}

export interface EffectiveVoiceContext {
  readonly channel: GenerationChannel;
  readonly requestedLanguage?: string;
}

export interface EffectiveVoiceResolution {
  readonly voiceHints: Partial<import("@my-ai-orchestrator/text-quality").VoiceProfile>;
  readonly metadata: ExecutionVoiceMetadataView;
}
