---
title: Legacy API Run Deprecation
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Legacy API Run Deprecation

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- ADR 0028 (client-sdk surface)

## What to build

Audit and remove legacy **`POST /api/run`** surface when no consumers remain:

1. Grep monorepo + document any client-sdk or test usage of `/api/run` vs `/me/executions/run`
2. Migrate internal callers to `/me/executions/run`
3. Remove `runHandler` from `/api` sub-router or return **410 Gone** with migration note for one release if external risk
4. Update parity/integration tests

Preserve identical pipeline behavior on `/me` route.

## Acceptance criteria

- [ ] No production code path calls `POST /api/run`.
- [ ] client-sdk uses only `/me/executions/run` for generation enqueue.
- [ ] Route removed or 410 with test asserting preferred path works.
- [ ] `routes-integration.test.ts` and execution tests green.

## Blocked by

- [100-backend-route-surface-cleanup.md](./100-backend-route-surface-cleanup.md)
