import { describe, expect, it } from "vitest";
import type { BillingLedgerEntry } from "../../packages/contracts/src/billing.js";
import { curateLedger } from "../../packages/payments/src/statement.js";

const ACCOUNT_ID = "user-1:criador";
const SUBSCRIPTION_ID = "user-1:criador:subscription";

function entry(overrides: Partial<BillingLedgerEntry> & Pick<BillingLedgerEntry, "entryType">): BillingLedgerEntry {
  return {
    subscriptionId: SUBSCRIPTION_ID,
    accountId: ACCOUNT_ID,
    creditsDelta: 0,
    balanceAfter: 0,
    referenceType: "subscription_cycle",
    referenceId: "cycle-1",
    idempotencyKey: `${overrides.entryType}-key`,
    metadata: {},
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides
  };
}

describe("curateLedger", () => {
  it("collapses a captured generation_cycle into 1 generation row netting the group", () => {
    const rows = curateLedger([
      entry({
        entryType: "reserve",
        creditsDelta: -50,
        referenceType: "generation_cycle",
        referenceId: "gen-1",
        createdAt: "2026-06-01T10:00:00.000Z"
      }),
      entry({
        entryType: "capture",
        creditsDelta: 0,
        referenceType: "generation_cycle",
        referenceId: "gen-1",
        createdAt: "2026-06-01T10:00:05.000Z"
      })
    ]);

    expect(rows).toEqual([
      { id: "gen-1", category: "generation", creditsDelta: -50, occurredAt: "2026-06-01T10:00:05.000Z" }
    ]);
  });

  it("collapses a released (uncaptured) generation_cycle into 1 refund row using the release's own delta", () => {
    const rows = curateLedger([
      entry({
        entryType: "reserve",
        creditsDelta: -30,
        referenceType: "generation_cycle",
        referenceId: "gen-2",
        createdAt: "2026-06-01T11:00:00.000Z"
      }),
      entry({
        entryType: "release",
        creditsDelta: 30,
        referenceType: "generation_cycle",
        referenceId: "gen-2",
        createdAt: "2026-06-01T11:00:05.000Z"
      })
    ]);

    expect(rows).toEqual([
      {
        id: "gen-2",
        category: "refund",
        creditsDelta: 30,
        occurredAt: "2026-06-01T11:00:05.000Z",
        note: "geração falhou — créditos devolvidos"
      }
    ]);
  });

  it("hides an orphan reserve (in-flight, no terminal event)", () => {
    const rows = curateLedger([
      entry({
        entryType: "reserve",
        creditsDelta: -20,
        referenceType: "generation_cycle",
        referenceId: "gen-3"
      })
    ]);

    expect(rows).toEqual([]);
  });

  it("maps grant_cycle, grant_rollover, grant_topup and expire 1:1 with the right category and sign", () => {
    const rows = curateLedger([
      entry({
        entryType: "grant_cycle",
        creditsDelta: 2500,
        referenceType: "subscription_cycle",
        referenceId: "cycle-1"
      }),
      entry({
        entryType: "grant_rollover",
        creditsDelta: 100,
        referenceType: "subscription_cycle",
        referenceId: "cycle-1"
      }),
      entry({
        entryType: "grant_topup",
        creditsDelta: 12,
        referenceType: "topup",
        referenceId: "topup-1"
      }),
      entry({
        entryType: "expire",
        creditsDelta: -80,
        referenceType: "subscription_cycle",
        referenceId: "cycle-0"
      })
    ]);

    expect(rows.map((row) => row.category)).toEqual(
      expect.arrayContaining(["monthly_credits", "rollover", "topup", "expiration"])
    );
    expect(rows.find((row) => row.category === "monthly_credits")?.creditsDelta).toBe(2500);
    expect(rows.find((row) => row.category === "rollover")?.creditsDelta).toBe(100);
    expect(rows.find((row) => row.category === "topup")?.creditsDelta).toBe(12);
    expect(rows.find((row) => row.category === "expiration")?.creditsDelta).toBe(-80);
  });

  it("orders all rows by occurredAt descending", () => {
    const rows = curateLedger([
      entry({ entryType: "grant_cycle", creditsDelta: 2500, createdAt: "2026-06-01T00:00:00.000Z" }),
      entry({ entryType: "grant_topup", creditsDelta: 12, referenceType: "topup", createdAt: "2026-06-03T00:00:00.000Z" }),
      entry({ entryType: "expire", creditsDelta: -80, createdAt: "2026-06-02T00:00:00.000Z" })
    ]);

    expect(rows.map((row) => row.occurredAt)).toEqual([
      "2026-06-03T00:00:00.000Z",
      "2026-06-02T00:00:00.000Z",
      "2026-06-01T00:00:00.000Z"
    ]);
  });
});
