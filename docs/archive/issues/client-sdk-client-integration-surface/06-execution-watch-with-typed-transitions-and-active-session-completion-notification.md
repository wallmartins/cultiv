---
title: Execution Watch With Typed Transitions And Active Session Completion Notification
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Execution Watch With Typed Transitions And Active Session Completion Notification

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Deliver **Execution Watch** as a product capability that emits typed
**Execution Transitions** and supports active-session **Completion
Notification** without introducing a separate notification domain.

This slice should prove end-to-end that:

- the SDK exposes execution observation as a high-level product capability
  via a single required `onTransition` callback
- transitions such as `started`, `progressed`, `completed`, and `failed` are
  explicit in a typed union discriminated
- the frontend can react to completion in-session without manual snapshot
  diffing or raw SSE handling
- `ObservationHandle` exposes only `stop()` (Minimal Observation Handle)

## Acceptance criteria

- [ ] The SDK exposes `executions.watch` as a product capability rather than a raw transport API.
- [ ] Execution observation emits typed transitions (`started`, `progressed`, `completed`, `failed`) through a single required `onTransition` callback.
- [ ] Transitions include `executionId`, typed payload (`progress` | `result` | `error`), optional `snapshot`, and `occurredAt`.
- [ ] Active-session completion can drive frontend completion feedback without introducing external notification delivery.
- [ ] `watch` returns an `ObservationHandle` exposing only `stop()`.

## Blocked by

- `05-canonical-executions-with-execution-identity-and-resume.md`
