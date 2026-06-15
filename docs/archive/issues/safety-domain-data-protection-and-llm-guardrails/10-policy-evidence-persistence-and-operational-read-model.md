---
title: Policy Evidence Persistence And Operational Read Model
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Policy Evidence Persistence And Operational Read Model

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that turns **Policy Evidence** into durable specialized records
for input, scope, output, and consent boundaries, and exposes a controlled
operational read model so internal actors can explain safety outcomes without
receiving unnecessary protected payload content.

This slice should prove the end-to-end behavior that:

- boundary decisions are durably reconstructable with policy version context
- evidence is specialized by boundary instead of collapsed into one opaque blob
- support workflows can distinguish input block, quarantine, scope failure,
  output block, and consent revocation
- observability does not become a secondary sensitive-data leak

Implementation scope:

- design specialized evidence record types for at least input, scope, output,
  and consent boundaries, each carrying the policy version and decision outcome
- persist evidence durably with minimal payload retention and clear separation
  from ordinary application logs
- expose a controlled operational read model that reveals outcome, boundary,
  actor, timing, and rationale category without requiring raw protected content
- align evidence emission with the existing **Audit Trail** semantics so
  investigations can correlate safety and operational actions
- ensure evidence recording failures are handled explicitly and do not silently
  erase critical safety decisions

## User stories covered

- 21, 22, 29, 46, 48, 50, 51, 54

## Acceptance criteria

- [x] The backend persists specialized **Policy Evidence** records for input, scope, output, and consent decisions instead of one opaque generic record.
- [x] Each evidence record carries enough durable context to reconstruct the decision later, including policy version and boundary type.
- [x] A controlled operational read model can distinguish input block, quarantine, scope failure, output block, and consent-related outcomes without exposing unnecessary protected payload content.
- [x] Evidence retention avoids storing sensitive payloads unless explicitly required by the policy boundary.
- [x] Integration tests cover evidence emission for at least one success or failure path from each major boundary family.

## Blocked by

- `02-public-input-safety-gateway-for-generation-boundaries.md`
- `03-instruction-override-attempt-detection-and-decisioning.md`
- `05-step-scope-contracts-and-handoff-validation.md`
- `07-output-release-gate-for-technical-and-sensitive-content.md`
- `08-voice-training-consent-gated-ingestion-and-protected-storage.md`
- `09-voice-consent-revocation-and-derived-voice-profile-invalidation.md`
