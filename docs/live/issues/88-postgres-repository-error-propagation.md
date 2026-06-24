---
title: Postgres Repository Error Propagation
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Postgres Repository Error Propagation

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Plan: [`code-quality-scale-readiness-implementation-plan.md`](../plan/code-quality-scale-readiness-implementation-plan.md) — Fase A

## What to build

Stop Postgres repositories from converting **infrastructure failures** into empty results or silent `undefined`. Query connection errors, constraint violations, and unexpected DB failures must propagate as a tagged **`DatabaseError`** (or equivalent infra error) through Effect layers to the HTTP error mapper (5xx with structured body).

**Not-found** remains explicit: zero rows from a successful query is still `undefined` / empty list — distinct from query failure.

Roll out across all `postgres-repositories/*.ts` files; add at least one integration or unit test per pattern proving a simulated failure does not return `[]`.

## Acceptance criteria

- [ ] Tagged `DatabaseError` exists and maps to 5xx in error-response chain.
- [ ] No `catchAll(() => Effect.succeed([]))` or equivalent on query `catch` for infra errors in postgres repos.
- [ ] Successful empty query still returns empty/not-found correctly.
- [ ] Tests cover at least job repo and one voice repo failure path.
- [ ] `pnpm test:ci:backend` green.

## Blocked by

None — can start immediately.
