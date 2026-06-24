---
title: Billing Worker Targeted Reload
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Billing Worker Targeted Reload

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Plan: Fase A
- Related: ADR 0004 (durable runtime)

## What to build

Replace **full billing snapshot reload** (`reloadBillingRepositoryInto` loading all 8 tables) on every worker job with a **targeted read** for the execution's **Application User**: subscription, wallet/reservation slice needed for `captureReservedCredits` / release.

Preserve correctness documented in progress-log (capture after API enqueue sees fresh credits). Worker hot path must not be O(all billing data).

Update `worker-main.ts`, `durable-job-runtime.ts`, and `durable-store.ts` as needed. Integration test: enqueue job for user A, mutate user B billing in PG, worker job for A must not require loading B's full ledger.

## Acceptance criteria

- [ ] Worker does not call full-table billing reload per job.
- [ ] Credit capture/release still correct after concurrent API enqueue (existing durable integration test passes or extended).
- [ ] Failure to load billing for user surfaces as error (benefits from issue 88).
- [ ] Document reload strategy in code comment (`ponytail:` ceiling if partial cache remains).

## Blocked by

- [88-postgres-repository-error-propagation.md](./88-postgres-repository-error-propagation.md)
