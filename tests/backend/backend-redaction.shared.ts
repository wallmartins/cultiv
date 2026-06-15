import { Effect } from "effect";
import { createBackendDatabaseClient } from "../../apps/backend/src/infra/database-bootstrap.js";
import { createBackendPolicyEvidenceService } from "../../apps/backend/src/safety/policy-evidence.js";
import { createBackendRedactionService } from "../../apps/backend/src/safety/redaction.js";
import type { BackendConfig } from "../../apps/backend/src/config/config.js";

export function createBackendRedactionTestConfig(): BackendConfig {
  return {
    environment: "test",
    executionMode: "sync",
    qualityMode: "balanced",
    defaultLanguage: "pt-BR",
    serviceName: "backend",
    host: "127.0.0.1",
    port: 3000,
    version: "0.1.0",
    billingPlanId: "pro",
    billingUserId: "backend"
  };
}

export async function createPolicyEvidenceHarness() {
  const config = createBackendRedactionTestConfig();
  const database = await Effect.runPromise(createBackendDatabaseClient(config));
  const redaction = createBackendRedactionService();
  const policyEvidence = createBackendPolicyEvidenceService({
    database,
    policyVersion: "v1",
    redaction
  });

  return {
    database,
    redaction,
    policyEvidence
  };
}
