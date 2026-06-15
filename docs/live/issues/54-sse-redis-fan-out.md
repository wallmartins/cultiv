---
title: SSE Redis Fan-out
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# SSE Redis fan-out

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Replace in-process SSE listeners (`job-store.subscribe`) with **Redis pub/sub** (or streams) so any API replica can stream execution events.

- Channel key: `execution:{executionId}:events` (or equivalent).
- Worker publishes progress / done / error to Redis after PG milestone updates.
- `createJobEventStream` subscribes to Redis; on connect, replay terminal state from PG if already complete.
- Initial events: load from PG job history or last known state, then live Redis.
- Remove `listeners` Map from job runtime.

## Acceptance criteria

- [ ] Integration test: API instance A serves SSE; worker on instance B publishes; client receives events.
- [ ] Client disconnect/reconnect receives terminal event from PG if job already finished.
- [ ] Contract `ExecutionSseEvent` wire format unchanged for SDK compatibility.
- [ ] No in-process `subscribe` Map in production path.

## Blocked by

- 52
