---
title: Fail-Closed Consent Revocation And Voice Artifact Invalidation
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Fail-Closed Consent Revocation And Voice Artifact Invalidation

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the hardening slice that makes `Voice Training Consent` revocation fail
closed when protected voice artifacts cannot be fully invalidated, so
revocation never reports success while reusable protected material still
remains available.

This slice should prove the end-to-end behavior that:

- revocation is a materially effective transition, not a best-effort cleanup
- protected artifact invalidation is treated as part of the consent boundary
- future voice reuse remains blocked if revocation cleanup did not complete
- operators can distinguish successful revocation from blocked or incomplete
  revocation attempts

Implementation scope:

- remove permissive cleanup fallbacks that currently allow revocation to succeed
  after failed artifact deletion
- model the revocation lifecycle so cleanup failure either blocks completion or
  leaves an explicit non-reusable incomplete state
- keep future voice derivation and retrieval blocked unless the revocation path
  completed according to policy
- add focused tests for failure in each critical cleanup path

## User stories covered

- 11, 12, 13, 46, 49, 53

## Acceptance criteria

- [x] Revoking consent does not complete successfully if critical voice artifact invalidation fails.
- [x] Future voice reuse remains blocked unless revocation cleanup has completed according to policy.
- [x] Audit and evidence semantics distinguish successful revocation from blocked or incomplete revocation transitions.
- [x] Focused tests cover cleanup failure for examples, derived profile, diagnostics, and snapshots.

## Blocked by

- `13-voice-training-field-protection-and-protected-persistence.md`
