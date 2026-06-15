---
title: Durable Operational Override Grants And Restart-Safe Lifecycle
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Durable Operational Override Grants And Restart-Safe Lifecycle

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the architectural hardening slice that moves operational override grants
out of process memory into a durable backend-owned lifecycle, so one-shot and
time-limited overrides remain valid, expirable, and auditable across restarts
and multi-instance execution.

This slice should prove the end-to-end behavior that:

- granted overrides are not tied to one backend process lifetime
- consumption and expiry remain consistent across restarts and multiple
  instances
- the operational override boundary stays narrow and auditable while becoming
  production-safe
- durability does not weaken non-overridable policy enforcement

Implementation scope:

- introduce a repository-backed persistence model for operational override
  grants and lifecycle state
- preserve current approval, consumption, expiry, and audit semantics through a
  stable service boundary
- make one-shot consumption and expiry restart-safe and idempotent
- add focused tests for durable grant lifecycle behavior

## User stories covered

- 24, 25, 26, 27, 28, 29, 46

## Acceptance criteria

- [x] Operational override grants are stored durably instead of only in process memory.
- [x] One-shot consume and time-limited expiry remain correct across service restart or multi-instance behavior assumptions.
- [x] Existing non-overridable family and category protections remain unchanged.
- [x] Focused tests cover durable grant creation, consumption, expiry, and audit/evidence continuity.

## Blocked by

None - can start immediately.

## Delivered

- operational override grants now persist through a backend-owned repository backed by the canonical database memory store instead of process-local `Map` state
- grant lifecycle is now explicit and restart-safe with durable `active`, `consumed`, and `expired` states, so replayed one-shot consumes return `override_already_consumed` instead of silently degrading to `not_found`
- consumption and expiry are evaluated inside the database transaction boundary, preserving consistent lifecycle transitions across restarts and multiple service instances sharing the same database state
- existing override approval policy, non-overridable family/category enforcement, audit events, and override evidence semantics remain unchanged at the service boundary
- focused durability tests now cover durable grant persistence, restart-safe one-shot consumption, cross-instance expiry handling, and single-emission expiry audit continuity
