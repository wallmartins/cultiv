---
title: Migrations E Validacao De Schema No Boot
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Migrations E Validacao De Schema No Boot

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Add an explicit PostgreSQL migration flow and make boot fail when the database
schema is not ready for the running backend.

This slice should prove end-to-end behavior that:

- migrations are versioned and run as a deliberate deploy step
- schema version or readiness mismatches are detected on boot
- the backend refuses to serve traffic when the database is not in the expected state

Implementation expectations for this slice:

- define a single migration/bootstrap entrypoint for production deployments
- make that entrypoint explicit enough that deploy tooling can call it without
  starting the HTTP server
- make schema migrations an explicit operational step rather than something the
  request path attempts to do lazily
- keep migration files versioned and ordered so schema evolution is reproducible
- validate the expected schema version during boot before the backend reports
  itself as ready
- fail fast when the database is missing, unreachable, or on an unsupported
  schema version
- keep the boot-time schema check aligned with the exact migration version the
  deployed backend expects to run against
- keep local development and test boot flows distinct from production
  migration enforcement so developers can still run the backend without
  accidentally mutating a live database
- allow local/test runs to skip production migration enforcement when the
  environment is explicitly non-production
- ensure the boot-time check explains whether the failure is connectivity,
  schema mismatch, or missing migration state
- keep the migration runner isolated enough that it can be executed as a
  deliberate deploy task and tested independently of the HTTP server
- avoid burying migration logic inside route initialization or application
  startup side effects

## Acceptance criteria

- [x] Schema migrations are explicit and versioned.
- [x] Migration execution is a deliberate deploy-time step rather than an implicit runtime side effect.
- [x] Boot validates database readiness and fails fast on mismatch.
- [x] Boot clearly reports whether the failure is connectivity, schema mismatch, or unsupported version state.
- [x] Development and test workflows are not forced through the same deployment path as production migrations.
- [x] The exact migration version expected by the booting backend is visible in the failure or readiness diagnostics.
- [x] The migration and validation path is isolated enough to be tested without public HTTP routes.

## Blocked by

- `04-postgresql-sistema-de-registro.md`
