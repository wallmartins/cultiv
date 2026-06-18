import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type {
  FeatureFlagRegistry,
  FeatureFlagServiceContract
} from "@my-ai-orchestrator/feature-flags";
import type { BillingRepository, BillingServiceContract } from "@my-ai-orchestrator/payments";
import type { BackendPersistence } from "../persistence/persistence-types.js";
import type { BackendObservabilityService } from "./observability-types.js";
import type { BackendUsagePolicy } from "../usage/usage-policy-types.js";
import type { BackendAIPolicyServiceContract } from "../ai-policy/ai-policy-types.js";
import type { BackendSafetyPolicyServiceContract } from "../safety-policy/safety-policy-types.js";
import type { BackendGenerationPreviewService } from "../generation/generation-preview-types.js";
import type { BackendPublicInputSafetyGatewayService } from "../../safety/public-input-safety-types.js";
import type { BackendOutputReleaseGateService } from "../../safety/output-release-types.js";
import type { BackendVoiceConsentService } from "../../safety/voice-consent-types.js";
import type { BackendVoiceRebuildService } from "../voice/voice-rebuild-types.js";
import type { BackendVoiceService } from "../voice/voice-types.js";
import type { BackendApplicationUserRepository } from "../../auth/application-user.js";
import type { BackendOperatorRepository } from "../../auth/operator.js";
import type { BackendPolicyEvidenceService } from "../../safety/policy-evidence-types.js";
import type { BackendRedactionService } from "../../safety/redaction-types.js";
import type { BackendOperationalOverrideService } from "../../safety/operational-override-types.js";
import type { BillingCheckoutService } from "../billing/billing-checkout-service.js";
import type { BillingWebhookService } from "../billing/billing-webhook-service.js";

export interface BackendProductServices {
  readonly database: DatabaseClient;
  readonly featureFlags: FeatureFlagServiceContract;
  readonly featureFlagRegistry: FeatureFlagRegistry;
  readonly aiAdapters: AIAdapterServiceContract;
  readonly billing: BillingServiceContract;
  readonly billingRepository: BillingRepository;
  readonly rawDatabase: DatabaseClient;
  readonly observability: BackendObservabilityService;
  readonly persistence: BackendPersistence;
  readonly aiPolicy: BackendAIPolicyServiceContract;
  readonly experimentalAIPolicy?: BackendAIPolicyServiceContract;
  readonly safetyPolicy: BackendSafetyPolicyServiceContract;
  readonly inputSafety: BackendPublicInputSafetyGatewayService;
  readonly outputSafety: BackendOutputReleaseGateService;
  readonly usagePolicy: BackendUsagePolicy;
  readonly generationPreview: BackendGenerationPreviewService;
  readonly voiceRebuild: BackendVoiceRebuildService;
  readonly voice: BackendVoiceService;
  readonly voiceConsent: BackendVoiceConsentService;
  readonly policyEvidence: BackendPolicyEvidenceService;
  readonly operationalOverride: BackendOperationalOverrideService;
  readonly redaction: BackendRedactionService;
  readonly users: BackendApplicationUserRepository;
  readonly operators: BackendOperatorRepository;
  readonly billingCheckout?: BillingCheckoutService;
  readonly billingWebhook?: BillingWebhookService;
}
