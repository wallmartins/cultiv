import type { ApiErrorCode } from "@my-ai-orchestrator/contracts";
import type { AppMessages } from "~/i18n/app/types";

export type MappedSdkError = {
  readonly title: string;
  readonly message: string;
  readonly action?: string;
};

export function mapSdkErrorCode(
  code: ApiErrorCode | undefined,
  messages: AppMessages
): MappedSdkError {
  const errors = messages.errors;

  switch (code) {
    case "safety_input_blocked":
      return errors.safetyInputBlocked;
    case "safety_input_quarantined":
      return errors.safetyInputQuarantined;
    case "quote_stale":
      return errors.quoteStale;
    case "usage_restricted":
      return errors.usageRestricted;
    case "authentication_expired_token":
      return errors.authenticationExpired;
    case "voice_training_consent_required":
      return errors.voiceConsentRequired;
    case "rate_limited":
      return errors.rateLimited;
    case "service_unavailable":
      return errors.serviceUnavailable;
    default:
      return errors.default;
  }
}
