import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type { BackendPolicyEvidenceService } from "./policy-evidence-types.js";
import type { VoiceTrainingConsentRecord } from "@my-ai-orchestrator/database";

export interface BackendVoiceConsentDependencies {
  readonly database: DatabaseClient;
  readonly now: () => Date;
  readonly policyEvidence?: BackendPolicyEvidenceService;
}

export function buildVoiceConsentResourceId(userId: string): string {
  return `voice-consent:${userId}`;
}

export function isRevocationPending(consent: VoiceTrainingConsentRecord | undefined): boolean {
  return Boolean(consent && !consent.granted && consent.grantedAt && !consent.revokedAt);
}
