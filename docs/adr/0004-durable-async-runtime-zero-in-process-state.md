---
title: Durable Async Runtime — Zero In-Process Business State
doc_type: adr
status: accepted
last_updated: 2026-06-14
---

# Durable async runtime — zero in-process business state

From MVP onward, **no business state may live only in the Node.js heap** of the API or worker processes. Process restart, deploy, crash, or horizontal scaling must not lose **jobs**, **credit reservations**, **queues**, **rate-limit counters**, or **idempotency** outcomes. Ephemeral per-request data and short-lived caches that rebuild from durable stores are allowed.

We decided on a **stateless API + worker tier** with **PostgreSQL as the system of record** for contracts, money, jobs, voice, audit, and the **transactional outbox**, plus **Redis** for job transport, SSE fan-out, and hot counters (with persistence enabled). **Edge rate limiting** (WAF / CDN) remains the first line against DDoS and bot floods; application limits enforce per-user and per-plan policy.

Async generation is the **only** product execution path: `POST` enqueues durably; workers consume from Redis; clients observe via SSE backed by Redis and terminal state from PostgreSQL.

## Considered Options

1. **Keep in-memory `job-store` + best-effort PG persistence** — Rejected. Dual source of truth; restart loses runtime; multi-replica breaks SSE and listing.
2. **PostgreSQL only (no Redis)** — Rejected for MVP async. SSE fan-out and queue latency need a hot transport; polling PG for queue depth does not scale operationally.
3. **Redis as system of record for jobs** — Rejected. Billing and audit require strong relational transactions; Redis complements PG, does not replace it.
4. **Cassandra (or other AP store) as primary database** — Rejected for this program. Existing Kysely/JSONB domain model, billing ledger, and outbox pattern fit PostgreSQL; migration cost exceeds measured need.
5. **PostgreSQL (strong) + Redis (transport) + outbox + edge WAF** — Accepted.

## Architecture

```
Edge (WAF / IP rate limit)
    → API (stateless)
        → PG transaction: job + billing reserve + outbox row
        → commit
    → Outbox relay → Redis queue (BullMQ)
    → Worker(s) → pipeline → PG terminal state + outbox progress events
    → Relay → Redis pub/sub → SSE on any API replica
```

### What must be durable (PostgreSQL)

| Concern | Store |
|---------|--------|
| Job lifecycle (`queued` → `running` → `done` / `failed`) | `jobs` |
| Billing ledger, reservations, subscriptions, idempotency | billing tables |
| Transactional outbox | `outbox` |
| Application users, voice, audit | existing tables |
| Execution idempotency keys | dedicated table or unique constraint |
| Optional: coarse job progress milestones | `jobs` (not per-tick audit) |

### What must be durable or external (Redis)

| Concern | Store |
|---------|--------|
| Job queue | BullMQ / streams |
| SSE fan-out across API replicas | pub/sub or streams |
| HTTP / per-user rate limits | counters with TTL |
| Daily traffic limits per plan | counters with TTL |

Redis must run with **AOF (or equivalent)** so a Redis restart does not silently drop unpublished queue messages; the outbox relay remains authoritative until publish is acknowledged.

### Allowed in-process (non-business)

- Request-scoped parsing, auth context, Effect layers for a single HTTP call
- Readiness snapshot cache (TTL ≤ few seconds), JWKS warm cache
- Connection pools, no business Maps

### Forbidden in-process (business)

- `job-store` Map as source of truth
- `packages/payments` in-memory repository in non-test environments
- `usage-policy` traffic `Map`, `rate-limiter` `Map`, execution `idempotencyCache`
- `queueMicrotask` worker queue
- In-memory fallbacks for `application_users` / `operators` when `DATABASE_URL` is set
- Waitlist rate-limit `Map` on web

## Async POST contract (locked)

1. Authenticate; safety and policy gates (read-mostly).
2. **Single PG transaction:** insert job (`queued`), **reserve credits**, insert outbox event (`ExecutionEnqueued`).
3. Return `202` + `executionId` only after commit.
4. Relay publishes to Redis; worker claims job idempotently by `executionId`.
5. Progress events → Redis (SSE); terminal state → PG + billing capture/release.
6. Client reconnect: SSE from Redis; `GET /me/executions/:id` from PG.

Credit reservation moves from worker-time to **enqueue-time** so queue depth cannot exceed committed wallet state.

## Consequences

- **Local dev:** `docker compose` (or equivalent) provides PostgreSQL + Redis; `DATABASE_URL` and `REDIS_URL` required for backend dev except pure unit tests.
- **`createDatabase()` in-memory** remains only for isolated unit tests, not integration or deployed environments.
- **`job-store.ts`** is removed or reduced to a thin adapter over PG + Redis events—not a Map.
- **Workers** run as separate process(es) from the HTTP server.
- **Tests:** integration suite must prove restart recovery and multi-instance SSE (issues 48–57).
- **Write amplification:** job progress audit per pipeline tick is removed from the critical path; audit at `queued`, `running` (optional), `completed` / `failed`, and billing mutations.
- **Program docs:** [PRD](../live/prd/durable-async-runtime.md), [plan](../live/plan/durable-async-runtime-implementation-plan.md), [issues 48–57](../live/issues/README.md#durable-async-runtime).

## Related decisions

- Billing persistence aligns with archived production-readiness issue 06; this ADR supersedes any tolerance for in-memory billing in deployed environments.
- Client SDK execution watch resilience (SSE → poll) remains valid; backend SSE must work cross-replica via Redis.
