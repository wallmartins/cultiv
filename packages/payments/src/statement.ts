import type { BillingLedgerEntry, LedgerStatementCategory, LedgerStatementRow } from "@my-ai-orchestrator/contracts";

const DIRECT_CATEGORY_BY_ENTRY_TYPE: Partial<Record<BillingLedgerEntry["entryType"], LedgerStatementCategory>> = {
  grant_cycle: "monthly_credits",
  grant_rollover: "rollover",
  grant_topup: "topup",
  expire: "expiration"
};

// contract-05 §0 — "refund" entryType has no producer; estorno is reconstructed below from a
// release without a matching capture, not from entryType:"refund".
const REFUND_NOTE = "geração falhou — créditos devolvidos";

function curateDirectEntry(entry: BillingLedgerEntry): LedgerStatementRow | undefined {
  const category = DIRECT_CATEGORY_BY_ENTRY_TYPE[entry.entryType];
  if (!category) {
    return undefined;
  }

  return {
    id: entry.idempotencyKey,
    category,
    creditsDelta: entry.creditsDelta,
    occurredAt: entry.createdAt
  };
}

// contract-05 §2 — collapses a generation_cycle group (reserve/capture/release, joined by
// referenceId = generationCycleId) into a single curated row.
function readBriefingTopic(group: readonly BillingLedgerEntry[]): string | undefined {
  const reserve = group.find((entry) => entry.entryType === "reserve");
  const topic = reserve?.metadata?.briefingTopic;
  return typeof topic === "string" ? topic : undefined;
}

function curateGenerationGroup(
  referenceId: string,
  group: readonly BillingLedgerEntry[]
): LedgerStatementRow | undefined {
  const capture = group.find((entry) => entry.entryType === "capture");
  if (capture) {
    return {
      id: referenceId,
      category: "generation",
      creditsDelta: group.reduce((total, entry) => total + entry.creditsDelta, 0),
      occurredAt: capture.createdAt,
      topic: readBriefingTopic(group)
    };
  }

  const release = group.find((entry) => entry.entryType === "release");
  if (release) {
    return {
      id: referenceId,
      category: "refund",
      creditsDelta: release.creditsDelta,
      occurredAt: release.createdAt,
      note: REFUND_NOTE,
      topic: readBriefingTopic(group)
    };
  }

  return undefined; // only a reserve — in-flight, hidden (no churn shown)
}

export function curateLedger(entries: readonly BillingLedgerEntry[]): readonly LedgerStatementRow[] {
  const generationGroups = new Map<string, BillingLedgerEntry[]>();
  const rows: LedgerStatementRow[] = [];

  for (const entry of entries) {
    if (entry.referenceType !== "generation_cycle") {
      const row = curateDirectEntry(entry);
      if (row) {
        rows.push(row);
      }
      continue;
    }

    const group = generationGroups.get(entry.referenceId) ?? [];
    group.push(entry);
    generationGroups.set(entry.referenceId, group);
  }

  for (const [referenceId, group] of generationGroups) {
    const row = curateGenerationGroup(referenceId, group);
    if (row) {
      rows.push(row);
    }
  }

  return rows.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}
