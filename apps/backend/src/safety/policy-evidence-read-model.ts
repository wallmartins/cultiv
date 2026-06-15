import { Effect } from "effect";
import type { DatabaseClient } from "@my-ai-orchestrator/database";
import type {
  BackendPolicyEvidenceService,
  PolicyEvidenceFilter,
  PolicyEvidenceReadModelEntry
} from "./policy-evidence-types.js";
import type { BackendRedactionService } from "./redaction-types.js";

export function listOperationalPolicyEvidence(args: {
  readonly database: DatabaseClient;
  readonly redaction: BackendRedactionService;
  readonly filter: PolicyEvidenceFilter;
}): Effect.Effect<readonly PolicyEvidenceReadModelEntry[]> {
  return Effect.gen(function* () {
    const all = yield* args.database.audit.list();
    const evidence = all.filter((record) =>
      record.resourceType.startsWith("policy_evidence:")
    );

    const filtered = evidence.filter((record) => {
      if (args.filter.boundary && !record.resourceType.endsWith(`:${args.filter.boundary}`)) {
        return false;
      }
      if (args.filter.outcome) {
        const outcomeParts = record.mutationType.split(".");
        const recordOutcome = outcomeParts[outcomeParts.length - 1] ?? "";
        if (recordOutcome !== args.filter.outcome) {
          return false;
        }
      }
      if (args.filter.actorId && record.actorId !== args.filter.actorId) {
        return false;
      }
      if (args.filter.resourceId && record.resourceId !== args.filter.resourceId) {
        return false;
      }
      if (args.filter.resourceType && record.resourceType !== args.filter.resourceType) {
        return false;
      }
      if (args.filter.since && record.occurredAt < args.filter.since) {
        return false;
      }
      if (args.filter.until && record.occurredAt > args.filter.until) {
        return false;
      }
      return true;
    });

    return filtered.map((record) => toReadModelEntry(record, args.redaction));
  });
}

function toReadModelEntry(
  record: {
    readonly id: string;
    readonly actorId: string;
    readonly actorType: "application_user" | "operator" | "system";
    readonly resourceType: string;
    readonly resourceId: string;
    readonly occurredAt: string;
    readonly mutationType: string;
    readonly metadata: Readonly<Record<string, unknown>>;
  },
  redaction: BackendRedactionService
): PolicyEvidenceReadModelEntry {
  const boundary = record.resourceType.replace("policy_evidence:", "") as PolicyEvidenceReadModelEntry["boundary"];
  const outcomeParts = record.mutationType.split(".");
  const outcome = (outcomeParts[outcomeParts.length - 1] ?? "unknown") as PolicyEvidenceReadModelEntry["outcome"];
  const metadata = redaction.redactObject(record.metadata as Record<string, unknown>).redacted;

  return {
    id: record.id,
    boundary,
    outcome,
    actorId: record.actorId,
    actorType: record.actorType,
    policyVersion: typeof metadata.policyVersion === "string" ? metadata.policyVersion : "unknown",
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    occurredAt: record.occurredAt,
    rationaleCategory: typeof metadata.rationaleCategory === "string" ? metadata.rationaleCategory : null,
    summary: typeof metadata.summary === "string" ? metadata.summary : null
  };
}
