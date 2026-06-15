---
title: Restart and Multi-replica Verification Gate
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: HITL
last_updated: 2026-06-14
---

# Restart and multi-replica verification gate

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Consolidate **verification** for the Durable Async Runtime program.

Automated (CI):

- Restart test: enqueue job → kill API process → new API process → `GET` shows consistent state → worker completes → terminal in PG.
- Multi-replica SSE test (issue 54).
- Billing restart test: reserve + restart → reservation still visible; capture after completion correct.
- Grep/lint guard: no forbidden in-memory business stores in `apps/backend/src` (allowlist test helpers).

Manual checklist (HITL):

- [ ] `docker compose` documented path works on clean machine
- [ ] Edge rate limit documented for production deploy
- [ ] Redis AOF noted in staging/prod runbook
- [ ] Deploy rolling update: zero lost `202` executions in smoke test
- [ ] SDK drawer observes generation across API rolling restart

## Acceptance criteria

- [ ] New test file or suite `tests/backend/durable-runtime-*.test.ts` green in CI with PG+Redis services.
- [ ] Manual checklist attached to PR or issue comment with sign-off.
- [ ] `docs/live/plan/durable-async-runtime-implementation-plan.md` DoD section all checked.
- [ ] Parent issue acceptance criteria satisfied.

## Blocked by

- 53
- 54
- 55
- 56
