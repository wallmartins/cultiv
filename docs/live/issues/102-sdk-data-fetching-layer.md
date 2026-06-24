---
title: SDK Data Fetching Layer
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# SDK Data Fetching Layer

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Decisions: TanStack Query for server state (ADR drift)

## What to build

Introduce minimal **`useSdkQuery`** hook (or thin TanStack Query wrapper) centralizing:

- `loading | ready | error` status
- Abort/cancel on unmount
- Retry via key invalidation
- Optional stale-while-revalidate keyed by query params

Migrate hooks:

1. **`useExecutionsList`** (after server filters land)
2. **`useContentTypes`**
3. **`useGenerationIntents`**

Remove duplicated `cancelled` flag boilerplate from migrated hooks.

## Acceptance criteria

- [ ] `useSdkQuery` in `platform/runtime` or `platform/sdk`.
- [ ] 3 hooks migrated; behavior preserved.
- [ ] At least one test for retry/refetch on key change.
- [ ] `frontend-client-boundary` governance still passes.
- [ ] `pnpm test:web` green.

## Blocked by

- [91-execution-history-server-side-filters.md](./91-execution-history-server-side-filters.md)
