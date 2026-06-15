---
title: Canonical Executions With Execution Identity And Resume
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Canonical Executions With Execution Identity And Resume

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Make **Executions** the canonical generation capability in the SDK, centered on
`executionId` as the canonical **Execution Identity** and explicit resume
behavior after the user leaves the initial flow.

This slice should prove end-to-end that:

- the SDK exposes `create`, `list`, `get`, and `watch` (which covers resume)
  through execution semantics only
- `executions.create` is always async and returns `QueuedExecutionView`
- `executionId` is the canonical identity for retrieval, watch, and resume
- the user flow "request generation, leave, return later" works without
  frontend-owned transport glue
- the SDK auto-generates `idempotencyKey` internally for `create`

## Acceptance criteria

- [ ] The SDK exposes `executions.create`, `executions.list`, `executions.get`, and `executions.watch`.
- [ ] `executions.create` is always async, accepts `MeExecutionRequest`, and returns `QueuedExecutionView`.
- [ ] `executionId` is the single canonical identity used for retrieval, watch, and resume.
- [ ] A client can leave the initial generation flow and reattach to the same execution by calling `watch` again without reconstructing transport logic manually.

## Blocked by

- `03-framework-agnostic-client-sdk-core-with-authenticated-transport.md`
