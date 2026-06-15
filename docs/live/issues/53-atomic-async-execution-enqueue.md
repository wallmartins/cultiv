---
title: Atomic Async Execution Enqueue
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Atomic async execution enqueue

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Change async generation enqueue so **one PostgreSQL transaction** commits:

1. Job row (`queued`)
2. Billing **credit reservation** (issue 49 repository)
3. Outbox row (`ExecutionEnqueued`)

Only after commit:

- Return `202` to client
- Relay publishes to Redis (issue 51)

Move credit reservation **out of** `executeSyncRun` for async path (worker captures/releases against existing reservation). Sync path may remain for internal/trusted routes or be removed if product is async-only.

Set `EXECUTION_MODE=async` as default for product environments in docs; config validation encourages async for deployed stacks.

## Acceptance criteria

- [ ] Integration test: POST succeeds → PG has job + reservation + outbox; wallet reflects reserved credits.
- [ ] POST with insufficient credits rolls back entire transaction — no job row, no outbox.
- [ ] Worker does not call `reserveGenerationCredits` again for standard async jobs.
- [ ] Idempotency key on POST reuses prior response without double reservation (coordinates with issue 55).

## Blocked by

- 49
- 51
