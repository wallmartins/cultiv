---
title: Canonical Public Surface And Legacy Contract Removal
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Canonical Public Surface And Legacy Contract Removal

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Establish the canonical product-facing backend surface for the **Client
Integration Surface** and remove legacy pipeline/job language from the active
client contract.

This slice should prove end-to-end that:

- preview, content types, executions, execution events, and voice routes are
  the only approved product-facing backend capabilities for frontend clients
- `/api/pipelines` and `/api/jobs` are explicitly treated as legacy and are
  excluded from the SDK design and active docs
- product documentation uses **Executions** instead of backend **Job**
  mechanics as the frontend-facing language
- the SDK auto-generates `idempotencyKey` for mutating requests; consumers do
  not pass or manage it directly

## Acceptance criteria

- [ ] The active backend API documentation identifies the product-facing surface as canonical for frontend clients.
- [ ] Legacy `/api/pipelines` and `/api/jobs` routes are explicitly excluded from the client contract and marked for removal.
- [ ] The client-facing language in live documentation uses product capabilities and no longer treats pipeline/job routes as first-class frontend concepts.

## Blocked by

None - can start immediately.
