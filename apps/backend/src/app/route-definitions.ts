export const Routes = {
  Health: "GET /health",
  ApiHealth: "GET /api/health",
  Ready: "GET /ready",
  ApiReady: "GET /api/ready",

  GetMeContentTypes: "GET /me/content-types",
  GetMeGenerationIntents: "GET /me/generation-intents",

  PostMeExecutionsRun: "POST /me/executions/run",
  GetMeExecutions: "GET /me/executions",
  GetMeExecution: "GET /me/executions/:executionId",
  GetMeExecutionEvents: "GET /me/executions/:executionId/events",

  GetMeVoiceTrainingConsent: "GET /me/voice-training-consent",
  PostMeVoiceTrainingConsent: "POST /me/voice-training-consent",
  GetMeVoiceProfile: "GET /me/voice-profile",
  PostMeVoiceProfileTraitConfirmations: "POST /me/voice-profile/trait-confirmations",
  GetMeVoiceProfileExamples: "GET /me/voice-profile/examples",
  PostMeVoiceProfileExamples: "POST /me/voice-profile/examples",
  PatchMeVoiceProfileExample: "PATCH /me/voice-profile/examples/:exampleId",
  PostMeVoiceProfileBatches: "POST /me/voice-profile/example-batches",
  PostMeVoiceProfileBatchItems: "POST /me/voice-profile/example-batches/:batchId/items",
  PostMeVoiceProfileBatchCommit: "POST /me/voice-profile/example-batches/:batchId/commit",

  PostMeBillingCheckout: "POST /me/billing/checkout",
  GetMeBillingEntitlement: "GET /me/billing/entitlement",

  PostApiGenerationPreview: "POST /api/generation-preview",

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
  Suspended: "suspended"
} as const;

export const OperatorStatus = {
  Active: "active",
  Suspended: "suspended"
} as const;
