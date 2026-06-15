---
title: Redis Queue and Worker Process
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Redis queue and worker process

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Replace `queueMicrotask` worker in `app.ts` with **BullMQ** (or agreed library) on Redis.

- Queue name e.g. `executions`; job data minimal (`executionId`, correlation ids).
- Separate entrypoint: `apps/backend/src/worker-main.ts` (or `pnpm backend:worker`) — not started inside HTTP server.
- Consumer loads job from PG by `executionId`, transitions `queued` → `running`, runs pipeline via existing `processQueuedJob` logic refactored.
- Retry policy with backoff; dead-letter or `failed` terminal in PG after max attempts.
- Remove `onQueuedJob` microtask path from `createBackendApp`.

## Acceptance criteria

- [ ] HTTP server starts without in-process job execution.
- [ ] Worker process consumes from Redis and completes job in PG.
- [ ] Multiple worker replicas do not double-run same execution (PG claim or BullMQ jobId = executionId).
- [ ] Document `pnpm` scripts for API vs worker in README / plan.

## Blocked by

- 51
