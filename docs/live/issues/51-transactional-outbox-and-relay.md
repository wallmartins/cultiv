---
title: Transactional Outbox and Relay
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Transactional outbox and relay

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Add **transactional outbox** table and a **relay process** that publishes unpublished rows to Redis.

- Migration `outbox` (see implementation plan schema).
- Repository: insert outbox row in same transaction as job create (used fully in issue 53).
- Relay: poll `WHERE published_at IS NULL` with `FOR UPDATE SKIP LOCKED` (or LISTEN/NOTIFY wake-up).
- Mark `published_at` only after Redis ACK (queue add success).
- Event types minimum: `ExecutionEnqueued`; extend later for progress if needed.
- Relay runnable as: separate npm script, sidecar in same repo, or lightweight worker entrypoint.

## Acceptance criteria

- [ ] Unit/integration test: job + outbox row committed together; relay publishes and marks published.
- [ ] Simulated Redis failure leaves rows unpublished; relay retries without duplicate side effects on consumer (idempotent publish key).
- [ ] Outbox lag metric or log line for operations.

## Blocked by

- 50
