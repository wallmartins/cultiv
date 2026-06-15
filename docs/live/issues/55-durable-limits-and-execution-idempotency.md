---
title: Durable Limits and Execution Idempotency
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Durable limits and execution idempotency

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Move abuse-control and idempotency state out of process memory.

**HTTP rate limiting** (`production/rate-limiter.ts`):

- `RateLimitStore` interface with Redis (preferred) or PostgreSQL implementation.
- Key: `clientKey` + normalized path (existing `normalizeRateLimitPath`).

**Usage traffic limits** (`usage-policy.ts`):

- Daily per-user/per-plan counter in Redis with TTL to UTC midnight (or PG bucket table).

**Execution idempotency** (`execution/index.ts` `idempotencyCache`):

- Table `execution_idempotency` with unique `(user_id, idempotency_key)`.
- Store fingerprint + response snapshot or `execution_id` reference.

**Execution memory L1** (optional in this slice):

- Remove write-only L1 or add read-through from PG `memories` on worker start.

Document edge WAF requirement in deployment checklist (operator-facing, not necessarily code).

## Acceptance criteria

- [ ] Rate limit test survives API restart (counter still enforced).
- [ ] Traffic limit test survives restart.
- [ ] Idempotency: duplicate POST with same key returns same `executionId` without duplicate job.
- [ ] `backend-production-hardening.test.ts` updated for durable rate limiter (test Redis or PG test double).
- [ ] No domain `Map` in `rate-limiter.ts`, `usage-policy.ts`, `execution/index.ts` idempotency.

## Blocked by

- 48
