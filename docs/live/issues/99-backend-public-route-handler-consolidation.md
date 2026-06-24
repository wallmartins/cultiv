---
title: Backend Public Route Handler Consolidation
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Backend Public Route Handler Consolidation

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Architecture Deepening (DX)

## What to build

Introduce **`createPublicRoute`** (or equivalent) helper encapsulating the repeated Hono handler pattern:

1. `resolvePublicActor`
2. `readJsonBody` (when POST/PATCH)
3. `decode*` via Effect Schema
4. Call service via `runEffectOrThrow`
5. `validateResponseBody` + JSON response

Refactor **at least 3** high-traffic routes as pilot (`executions`, `voice-profile` GET, `billing` checkout). Unify **`public-auth`** and **`operational-auth`** shared JWT parsing into one internal module if overlap remains >30 lines.

## Acceptance criteria

- [ ] Helper exported and documented with one usage example in comment.
- [ ] 3+ routes migrated; behavior unchanged (existing integration tests pass).
- [ ] JWT parsing duplication reduced between public/operational auth.
- [ ] No regression in error status codes.

## Blocked by

- [88-postgres-repository-error-propagation.md](./88-postgres-repository-error-propagation.md)
