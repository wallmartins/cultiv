---
title: Durable Async Runtime
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: HITL
last_updated: 2026-06-14
---

# Durable Async Runtime

## Parent

- PRD: [`durable-async-runtime.md`](./durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)
- Plan: [`../plan/durable-async-runtime-implementation-plan.md`](../plan/durable-async-runtime-implementation-plan.md)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## What to build

Deliver the **Durable Async Runtime** program: from MVP onward, no business state lives only in Node.js process memory. Async generation uses PostgreSQL as system of record (jobs, billing, outbox), Redis for queue and SSE fan-out, decoupled workers, credit reservation at enqueue, and edge plus app rate limits.

This parent tracks:

- mandatory PG + Redis bootstrap for real environments
- durable billing
- job runtime backed by PostgreSQL
- transactional outbox and relay
- Redis queue and worker process
- atomic async POST
- multi-replica SSE
- durable limits and idempotency
- web waitlist alignment
- restart / multi-instance verification gate

**Out of program scope:** Cassandra migration, multi-region active-active, marketing surface changes.

## Child issues

| # | Issue | Type | Blocked by |
|---|-------|------|------------|
| 48 | [Durable database and Redis bootstrap](../issues/48-durable-database-redis-bootstrap.md) | AFK | — |
| 49 | [Billing PostgreSQL persistence](../issues/49-billing-postgresql-persistence.md) | AFK | 48 |
| 50 | [Job runtime PostgreSQL source of truth](../issues/50-job-runtime-postgresql-source-of-truth.md) | AFK | 48 |
| 51 | [Transactional outbox and relay](../issues/51-transactional-outbox-and-relay.md) | AFK | 50 |
| 52 | [Redis queue and worker process](../issues/52-redis-queue-and-worker-process.md) | AFK | 51 |
| 53 | [Atomic async execution enqueue](../issues/53-atomic-async-execution-enqueue.md) | AFK | 49, 51 |
| 54 | [SSE Redis fan-out](../issues/54-sse-redis-fan-out.md) | AFK | 52 |
| 55 | [Durable limits and execution idempotency](../issues/55-durable-limits-and-execution-idempotency.md) | AFK | 48 |
| 56 | [Web waitlist durable rate limiting](../issues/56-web-waitlist-durable-rate-limiting.md) | AFK | 55 |
| 57 | [Restart and multi-replica verification gate](../issues/57-restart-multi-replica-verification-gate.md) | HITL | 53, 54, 55, 56 |

**Suggested order:** 48 → (49 ∥ 50) → 51 → 52 → 53 → 54 → 55 → 56 → 57

## Acceptance criteria (program)

- [ ] No business `Map` stores in backend runtime bootstrap paths (jobs, billing, limits, idempotency).
- [ ] `DATABASE_URL` and `REDIS_URL` required outside pure unit tests; local compose documented.
- [ ] `POST /me/executions/run` returns `202` only after PG commit of job + reservation + outbox.
- [ ] Workers run outside the HTTP process and consume from Redis.
- [ ] SSE works when client and worker hit different API replicas (integration test).
- [ ] API restart test: enqueued job still completes or surfaces terminal state correctly.
- [ ] Billing state survives process restart (integration test).
- [ ] Issue 57 operator checklist signed off.

## Blocked by

- None for issue 48 — billing issues 35–38 logic exists but persistence layer must be replaced (issue 49).
