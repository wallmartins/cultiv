import { Effect } from "effect";
import type {
  BackendVoiceTrainingConsentFailureError,
  BackendVoiceTrainingConsentRequiredError
} from "../http/errors.js";

export interface BackendVoiceConsentService {
  readonly assertConsent: (
    userId: string
  ) => Effect.Effect<
    void,
    BackendVoiceTrainingConsentRequiredError | BackendVoiceTrainingConsentFailureError
  >;
  readonly getConsentStatus: (
    userId: string
  ) => Effect.Effect<
    { readonly granted: boolean; readonly grantedAt?: string; readonly revokedAt?: string },
    BackendVoiceTrainingConsentFailureError
  >;
  readonly grantConsent: (
    userId: string
  ) => Effect.Effect<
    void,
    BackendVoiceTrainingConsentFailureError
  >;
  readonly revokeConsent: (
    userId: string
  ) => Effect.Effect<
    void,
    BackendVoiceTrainingConsentFailureError
  >;
}
