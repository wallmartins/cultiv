---
title: Safety Policy Foundation And Boot Validation
doc_type: issue
status: ready-for-agent
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Safety Policy Foundation And Boot Validation

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the first vertical slice of the **Safety Domain** so the backend can boot
with one official safety-policy definition, one canonical classification
taxonomy, one canonical decision vocabulary, and fail-fast validation before any
public generation, persistence, or operational override flow is allowed to run.

This slice should prove the end-to-end behavior that:

- the backend has one backend-owned safety-policy source of truth rather than
  route-local guardrails
- policy definitions for input, imported context, step scope, consent, output,
  evidence, and override semantics can be loaded coherently at boot
- invalid or incomplete safety policy prevents startup with typed errors instead
  of silently degrading to permissive behavior
- downstream slices can depend on stable typed policy services instead of
  inventing their own local enums, string unions, or ad hoc defaults

Implementation scope:

- define the canonical policy version, policy family names, decision outcomes,
  data-classification categories, overrideability flags, and evidence boundary
  types as typed domain models
- use Effect `Schema` decoders and typed `Data.TaggedError` failures for policy
  parsing and boot validation
- expose the loaded policy through a small service interface so later slices can
  request policy data without touching storage or file-loading details
- model detector or scanner capabilities as optional adapters referenced by
  policy metadata, but keep policy ownership in backend TypeScript
- enforce launch-time invariants such as deny-by-default classification coverage,
  explicit overrideability for each decision family, and version stamps required
  for future **Policy Evidence**

## User stories covered

- 30, 32, 37, 40, 41, 48, 53, 55

## Acceptance criteria

- [ ] The backend can load one official safety-policy version with typed definitions for classification, boundary decision outcomes, evidence boundary types, and overrideability metadata.
- [ ] Boot validation fails closed with typed errors when a required policy family, classification rule, or decision contract is missing or invalid.
- [ ] Downstream services can consume the active safety policy through one stable backend service instead of reading raw config or duplicating literals.
- [ ] The design preserves external scanners as adapter-backed evidence providers instead of letting them become the canonical policy source.
- [ ] Focused module tests cover valid boot, invalid boot, missing policy families, and deny-by-default classification invariants.

## Blocked by

None - can start immediately.
