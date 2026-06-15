---
title: Durable Database and Redis Bootstrap
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Durable database and Redis bootstrap

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Make **PostgreSQL** and **Redis** mandatory for every non-unit-test backend environment. Remove silent in-memory database fallbacks when deploying or running local product development.

Deliverables:

- `docker-compose.yml` (or extend existing) with PostgreSQL + Redis services, documented ports and env vars.
- `REDIS_URL` in `BackendConfig` with validation for `development` / `production` (mirror `DATABASE_URL` rules).
- Bootstrap fails fast when stores are missing in those environments.
- `application-user-memory` / `operator-memory` not selected when `DATABASE_URL` is set (already true) — extend to **reject** production/development without `DATABASE_URL`.
- `.env.example` updated with `DATABASE_URL`, `REDIS_URL`.
- README or plan section: `docker compose up -d` before `pnpm dev:backend`.

## Acceptance criteria

- [ ] Backend refuses to start in `development` without `DATABASE_URL` and `REDIS_URL` (configurable escape hatch only for `test` / `NODE_ENV=test`).
- [ ] Compose file brings up PG + Redis; migrations run successfully against compose PG.
- [ ] Integration tests can target compose or Testcontainers PG+Redis (document chosen approach).
- [ ] No regression in existing CI (update CI services if needed).

## Blocked by

None.
