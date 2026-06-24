---
title: Billing API Boot Lazy Load
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Billing API Boot Lazy Load

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Plan: [`code-quality-scale-readiness-implementation-plan.md`](../plan/code-quality-scale-readiness-implementation-plan.md) — Fase H (escala)
- Related: issue 89 (worker targeted reload), issue 49 (billing PG persistence)
- ADR 0004 (durable runtime)

## What to build

Stop loading **all billing tables** into the in-memory `BillingRepository` at API **startup** (`loadBillingRepository` → `loadPostgresBillingRepository` reads every plan, subscription, ledger entry, usage record, etc.).

Introduce **lazy or on-demand loading** so API boot time and memory do not scale with total billing row count across all users. Complements issue 89 (worker per-job reload) — together they remove both hot-path and cold-path full-table scans.

Design constraints:

- Preserve `packages/payments` service API — swap how the repository is hydrated
- Reads for a given **Application User** must still see correct subscription/wallet at request time (read-through PG or cache with TTL, not stale global snapshot)
- Worker capture path remains correct after 89

Document chosen strategy (`ponytail:` ceiling if per-user cache without cross-instance invalidation).

## Acceptance criteria

- [ ] API bootstrap does not `SELECT *` from all 8 billing tables on every process start.
- [ ] `ensureDefaultFreeSubscription`, `reserveGenerationCredits`, and wallet preview for authenticated user still correct after restart.
- [ ] Integration test: seed billing for users A and B; API instance only loads data needed for request to user A (assert via query count spy or documented cache boundary).
- [ ] Startup integration or smoke test proves boot with large billing seed completes within bounded time (relative baseline acceptable).
- [ ] `pnpm test:ci:backend` green.

## Blocked by

- [89-billing-worker-targeted-reload.md](./89-billing-worker-targeted-reload.md)
