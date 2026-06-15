---
title: Durable Async Runtime
doc_type: prd
status: ready-for-agent
domain: backend-platform
last_updated: 2026-06-14
---

# Durable Async Runtime — PRD

## Summary

Eliminate all **in-process business state** from the backend and web waitlist path from MVP onward. Async text generation becomes the only execution mode for product flows: durable enqueue in PostgreSQL, transport via Redis, workers decoupled from the API, SSE observable from any replica, and billing reserved at enqueue time.

**Governance:** [ADR 0004](../../adr/0004-durable-async-runtime-zero-in-process-state.md) · [plan](../plan/durable-async-runtime-implementation-plan.md) · [parent issue](./issue-durable-async-runtime.md) · [issues 48–57](../issues/README.md#durable-async-runtime)

## Problem

The backend currently keeps **jobs**, **billing**, **rate limits**, **traffic counters**, and **idempotency** in memory while optionally mirroring some writes to PostgreSQL. Restart or deploy loses queued work and financial state; multiple API replicas see different jobs and break SSE. This blocks production confidence and contradicts an async-first product where users submit generations and observe progress remotely.

## Goals

1. **Zero business state in process RAM** — restart-safe from the first deployable MVP.
2. **Single source of truth per concern** — PostgreSQL for contracts and money; Redis for queue and live events.
3. **Transactional enqueue** — job + credit reservation + outbox in one commit before `202`.
4. **Horizontally scalable API** — any replica can serve `GET` and SSE for any execution.
5. **Defense in depth** — edge flood protection plus app-level limits by user and plan.
6. **Verifiable** — automated tests for restart recovery and multi-instance behavior.

## Non-goals

- Migrating primary domain storage to Cassandra or another AP database.
- Exactly-once end-to-end semantics (at-least-once with idempotent workers is sufficient).
- Persisting every pipeline progress tick to PostgreSQL.
- Changing public SDK contracts beyond what backend behavior already promises.
- Multi-region active-active deployment (documented as a later scale phase).

## Users and stakeholders

| Actor | Need |
|-------|------|
| End user | Generation survives refresh/restart; progress and result remain reachable |
| Operator | Audit trail and job history survive deploys |
| Engineering | Local dev parity with production stores (PG + Redis) |
| Finance | Credit reservations cannot disappear on crash |

## Product behavior (locked)

### Generation (async only for product routes)

1. User submits generation on **Generation Screen** → `POST /me/executions/run`.
2. API returns `202` with `executionId` after durable enqueue and credit reservation.
3. **Active Execution Drawer** observes via SSE; on disconnect, SDK may poll `GET /me/executions/:id`.
4. Terminal `done` or `failed` is always readable from PostgreSQL.

### Failure modes (user-visible)

| Situation | Expected behavior |
|-----------|-------------------|
| API restart after `202` | Job still `queued` or `running`; observation continues |
| Worker crash mid-run | Job retried or marked `failed`; reservation released per billing rules |
| Redis brief outage | Outbox relay catches up; SSE may pause, terminal state still in PG |
| Insufficient credits at POST | `402` / usage error before enqueue — no orphan queue entry |

## Technical requirements

### Infrastructure

- `DATABASE_URL` required for backend in dev, staging, production.
- `REDIS_URL` required for async runtime in the same environments.
- Docker Compose (or documented equivalent) for local PostgreSQL + Redis.
- Redis persistence (AOF) documented for staging/production.

### PostgreSQL

- Job rows authoritative for list, detail, and history.
- Billing tables for ledger, reservations, subscriptions, idempotency.
- `outbox` table with relay-friendly schema (`published_at`, payload, type).
- Migration path from current `jobs` / audit schema without data loss in fresh deploys.

### Redis

- BullMQ (or agreed queue library) for execution workers.
- Pub/sub or streams for SSE fan-out keyed by `executionId`.

### Edge

- Document required WAF / CDN rate limiting for production (operator checklist).

### Code removal

- In-memory `job-store` as SoR.
- In-memory billing repository in runtime bootstrap.
- `queueMicrotask` worker scheduling in `app.ts`.
- In-memory HTTP rate limiter, usage traffic map, execution idempotency map.
- Web waitlist in-memory rate limit store.

## Success metrics

| Metric | Target |
|--------|--------|
| Restart test | After kill API, queued/running jobs recover; no duplicate credit capture |
| Multi-replica test | SSE client on replica A receives events from worker attached to replica B |
| Zero `Map` business stores | Grep / lint gate in backend `src` (excluding tests) |
| Integration tests | New suite green in CI for issues 48–56 |
| Manual gate (57) | Operator sign-off on compose stack |

## Dependencies

- Existing PostgreSQL migrations and `postgres-job-repository`.
- Auth JIT and application users (PostgreSQL).
- Client SDK execution watch (resilience tests already present).
- Plan tier / billing entitlements (issues 35–38) — runtime must become durable.

## Out of scope / follow-ups

- Cassandra / analytics event store for pipeline telemetry.
- Multi-region deployment playbook.
- Kubernetes autoscaling policies (covered at ops layer after runtime is durable).
