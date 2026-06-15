---
title: Job Runtime PostgreSQL Source of Truth
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Job runtime PostgreSQL source of truth

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Make PostgreSQL the **only authoritative store** for job lifecycle consumed by HTTP routes.

- Implement `JobRuntime` (or refactor `BackendJobStoreServiceContract`) backed by `postgres-job-repository` / `DatabaseClient.jobs`.
- `GET /me/executions`, `GET /me/executions/:id`, list pagination query PG (filter by `user_id`), not in-memory `listJobs()`.
- `createQueuedJob` writes PG first; remove Map as read path.
- Stop swallowing persistence failures on queued job — enqueue fails if PG fails.
- Deprecate or delete in-memory `job-store.ts` Map SoR (may keep thin SSE adapter until issue 54).
- Reduce audit writes on progress: optional milestone only (align with ADR).

## Acceptance criteria

- [ ] After API restart, `GET /me/executions/:id` returns jobs created before restart (integration test with real PG).
- [ ] `execution-routes` never reads job status from process-local Map.
- [ ] `persistQueuedJob` errors propagate to client on POST failure.
- [ ] Job listing scales with DB query + limit/offset (no full-table load into RAM for production path).

## Blocked by

- 48
