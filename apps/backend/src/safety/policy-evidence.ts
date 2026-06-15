import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type {
  BackendPolicyEvidenceService,
  PolicyEvidenceFilter
} from "./policy-evidence-types.js";
import type { BackendRedactionService } from "./redaction-types.js";
import { createPolicyEvidenceRecorders } from "./policy-evidence-recorders.js";
import { listOperationalPolicyEvidence } from "./policy-evidence-read-model.js";

export function createBackendPolicyEvidenceService(options: {
  readonly database: DatabaseClient;
  readonly policyVersion: string;
  readonly redaction: BackendRedactionService;
}): BackendPolicyEvidenceService {
  const recorders = createPolicyEvidenceRecorders(options);

  return {
    ...recorders,
    listOperationalEvidence: (filter: PolicyEvidenceFilter) =>
      listOperationalPolicyEvidence({
        database: options.database,
        redaction: options.redaction,
        filter
      })
  };
}
