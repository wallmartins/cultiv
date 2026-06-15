import { Effect } from "effect";
import type { BackendVoiceConsentService } from "./voice-consent-types.js";
import {
  assertVoiceTrainingConsent,
  getVoiceTrainingConsentStatus
} from "./voice-consent-assertion.js";
import { grantVoiceTrainingConsent } from "./voice-consent-grant.js";
import { revokeVoiceTrainingConsent } from "./voice-consent-revocation.js";
import type { BackendVoiceConsentDependencies } from "./voice-consent-shared.js";

export function createBackendVoiceConsentService(options: {
  readonly database: import("@my-ai-orchestrator/database").DatabaseClient;
  readonly now: () => Date;
  readonly policyEvidence?: import("./policy-evidence-types.js").BackendPolicyEvidenceService;
}): BackendVoiceConsentService {
  const dependencies: BackendVoiceConsentDependencies = options;

  return {
    assertConsent: (userId) => assertVoiceTrainingConsent(userId, dependencies),
    getConsentStatus: (userId) => getVoiceTrainingConsentStatus(userId, dependencies),
    grantConsent: (userId) => grantVoiceTrainingConsent(userId, dependencies),
    revokeConsent: (userId) => revokeVoiceTrainingConsent(userId, dependencies)
  };
}
