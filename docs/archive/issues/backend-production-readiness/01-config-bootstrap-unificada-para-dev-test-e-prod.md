---
title: Config Bootstrap Unificada Para Dev Test E Prod
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Config Bootstrap Unificada Para Dev Test E Prod

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Create a single backend configuration bootstrap path that works consistently in
local development, tests, and production.

This slice should prove end-to-end behavior that:

- local contexts load `.env` explicitly and predictably
- production contexts rely on injected environment variables only
- missing required config fails fast with clear diagnostics
- the backend no longer depends on incidental entrypoint imports for config
  initialization

## Acceptance criteria

- [x] Local dev and test execution load configuration through one explicit bootstrap path.
- [x] Production configuration validation fails fast when required keys are missing.
- [x] The configuration path is isolated enough to be tested without HTTP routes or runtime side effects.

## Blocked by

None - can start immediately.
