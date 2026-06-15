---
title: Postgresql Sistema De Registro
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Postgresql Sistema De Registro

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Move the production persistence path to PostgreSQL as the system of record for
durable backend state.

This slice should prove end-to-end behavior that:

- core backend entities persist across process restarts
- read and write paths go through durable PostgreSQL-backed repositories in
  production
- the system no longer depends on in-memory production state for important data
- development and test environments keep their current fast local behavior
  unless explicitly pointed at PostgreSQL

Implementation expectations for this slice:

- introduce a production database bootstrap that is selected by environment,
  not by ad hoc route-level code
- define a single production connection source, such as a database URL or
  equivalent DSN, and keep local/test wiring from accidentally consuming it
- keep `development` and `test` wiring separate from production wiring so local
  workflows remain deterministic and do not require a live PostgreSQL server by
  default
- use environment configuration from issue 01 to decide whether the backend
  should create a PostgreSQL client or a local/in-memory client
- wire the durable repositories through the backend product layer, not through
  individual route handlers or execution helpers
- provision the production database client from a single bootstrap boundary
  that owns connection creation, connection reuse, and shutdown cleanup
- treat PostgreSQL as the system of record only for the production state that
  must survive restarts, deployment rollouts, and multi-instance execution
- keep local development support available through the existing in-memory or
  test-oriented path so developers can run the backend without production
  infrastructure
- define an explicit failure mode when production is requested but the database
  connection settings are missing, unreachable, or invalid
- make the persistence path explicit enough that the current environment can be
  inferred from config and tested independently
- keep repository interfaces stable while swapping the concrete storage backend
  behind them
- define the first production-backed entities in the slices already modeled by
  the shared database package, especially jobs, memories, content types,
  pipelines, and voice state
- avoid mixing migration concerns into this slice beyond whatever is required to
  stand up the PostgreSQL-backed repositories
- keep the provisioning model centered on application startup or service
  creation, not on per-request lazy initialization
- ensure the production bootstrap can be exercised without the HTTP layer so
  the database wiring stays testable as a deep module

## Acceptance criteria

- [x] Production-facing state is stored in PostgreSQL rather than in-memory repositories.
- [x] Durable state survives a restart and can be read back correctly.
- [x] Development and test modes continue to use a local-friendly persistence path unless PostgreSQL is explicitly configured.
- [x] The PostgreSQL persistence path is isolated enough to be tested as a deep module.
- [x] The backend can explain, from config and boot behavior, whether it is using production PostgreSQL or a local/test client.
- [x] A missing or invalid production database connection fails fast instead of silently falling back to in-memory state.

## Blocked by

- `01-config-bootstrap-unificada-para-dev-test-e-prod.md`
