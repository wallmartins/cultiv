export const Routes = {
  Health: "GET /health",
  ApiHealth: "GET /api/health",
  Ready: "GET /ready",
  ApiReady: "GET /api/ready",

  GetMeGenerationIntents: "GET /me/generation-intents",

  PostMeExecutionsRun: "POST /me/executions/run",
  GetMeExecutions: "GET /me/executions",
  GetMeExecution: "GET /me/executions/:executionId",
  GetMeExecutionEvents: "GET /me/executions/:executionId/events",
  PostMeExecutionReaction: "POST /me/executions/:executionId/reaction",
  DeleteMeExecutionReaction: "DELETE /me/executions/:executionId/reaction",
  PostMeExecutionCancel: "POST /me/executions/:executionId/cancel",

  GetMeVoiceTrainingConsent: "GET /me/voice-training-consent",
  PostMeVoiceTrainingConsent: "POST /me/voice-training-consent",
  GetMeVoiceProfile: "GET /me/voice-profile",
  PostMeVoiceProfileTraitConfirmations: "POST /me/voice-profile/trait-confirmations",

  PostMeVoiceCalibrationSessions: "POST /me/voice-calibration/sessions",
  GetMeVoiceCalibrationSession: "GET /me/voice-calibration/sessions/:sessionId",
  PostMeVoiceCalibrationSessionContext: "POST /me/voice-calibration/sessions/:sessionId/context",
  GetMeVoiceCalibrationSessionStep: "GET /me/voice-calibration/sessions/:sessionId/steps/:stepId",
  PostMeVoiceCalibrationSessionStepSubmit: "POST /me/voice-calibration/sessions/:sessionId/steps/:stepId/submit",
  PostMeVoiceCalibrationSessionStepSkip: "POST /me/voice-calibration/sessions/:sessionId/steps/:stepId/skip",
  PostMeVoiceCalibrationSessionComplete: "POST /me/voice-calibration/sessions/:sessionId/complete",
  GetMeVoiceCalibrationEntitlement: "GET /me/voice-calibration/entitlement",

  PostMeOnboardingComplete: "POST /me/onboarding/complete",
  GetMeOnboardingStatus: "GET /me/onboarding/status",

  PostMeAccountExport: "POST /me/account/export",
  GetMeAccountExportJob: "GET /me/account/export/:jobId",
  GetMeAccountExportDownload: "GET /me/account/export/:jobId/download",
  PostMeAccountReset: "POST /me/account/reset",
  DeleteMeAccount: "DELETE /me/account",

  PostMeBillingCheckout: "POST /me/billing/checkout",
  GetMeBillingEntitlement: "GET /me/billing/entitlement",
  GetBillingPlans: "GET /billing/plans",
  GetMeBillingPlans: "GET /me/billing/plans",
  GetMeBillingTopups: "GET /me/billing/topups",
  GetMeBillingStatement: "GET /me/billing/statement",
  PostMeBillingPortalSession: "POST /me/billing/portal-session",
  PostMeBillingSubscriptionCancel: "POST /me/billing/subscription/cancel",
  GetMeBillingCheckoutStatus: "GET /me/billing/checkout-status/:intentId",

  PostApiGenerationPreview: "POST /api/generation-preview",
  PostMeGenerationPrefill: "POST /me/generation-prefill",

  GetInternalPolicies: "GET /api/internal/policies",
  PostInternalPoliciesActivate: "POST /api/internal/policies/activate",
  PostInternalPoliciesReload: "POST /api/internal/policies/reload",
  PostInternalExperimentalRun: "POST /api/internal/experimental/run",
  PostInternalSafetyOverrides: "POST /api/internal/safety-overrides",
  PostInternalSafetyOverrideConsume: "POST /api/internal/safety-overrides/:overrideId/consume"
} as const;

export const Permissions = {
  AiPolicyActivate: "ai_policy.activate",
  SafetyOverride: "safety.override"
} as const;

export const Roles = {
  Staff: "staff",
  PlatformAdmin: "platform_admin"
} as const;

export const UserStatus = {
  Active: "active",
  Suspended: "suspended",
  Deleted: "deleted"
} as const;

export const OperatorStatus = {
  Active: "active",
  Suspended: "suspended"
} as const;
