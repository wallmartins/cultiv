---
title: Voice Training Field Protection And Protected Persistence
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Voice Training Field Protection And Protected Persistence

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the missing hardening slice that makes issue 08 materially true by
applying backend-owned protection to persisted `Voice Training Input` and other
selected consent-sensitive fields instead of relying only on consent gating and
repository naming.

This slice should prove the end-to-end behavior that:

- protected voice-training material is not persisted in plain application form
- the backend owns the protection boundary rather than delegating trust to
  infrastructure defaults
- authorized read paths can still recover protected material where the domain
  explicitly allows it
- protection failures fail closed instead of silently storing sensitive material
  through a weaker path

Implementation scope:

- introduce a dedicated backend protection boundary for protected persisted
  fields, separate from runtime redaction concerns
- apply the protection layer to `Voice Training Input` persistence and selected
  consent-sensitive fields in create, update, and batch ingestion paths
- ensure only explicitly authorized read surfaces can unwrap protected values
- add focused tests that prove protected persistence behavior instead of only
  consent-present gating

## User stories covered

- 9, 10, 43, 46, 47, 49

## Acceptance criteria

- [x] Persisted `Voice Training Input` and selected consent-sensitive fields receive backend-owned protection before repository storage.
- [x] Protection failures fail closed and prevent sensitive material from being stored through a weaker path.
- [x] Authorized voice rebuild and effective-resolution paths continue to function without broadening raw `Voice Example` exposure to the normal generation path.
- [x] Focused tests prove protected persistence behavior for create, update, and batch ingestion paths.

## Blocked by

None - can start immediately.
