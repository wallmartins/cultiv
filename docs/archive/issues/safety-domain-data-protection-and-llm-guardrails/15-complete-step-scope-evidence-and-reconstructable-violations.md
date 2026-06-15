---
title: Complete Step Scope Evidence And Reconstructable Violations
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Complete Step Scope Evidence And Reconstructable Violations

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the follow-up slice that completes `Policy Evidence` for every
`Step Scope` violation path, so support and compliance workflows can reconstruct
scope failures regardless of whether they happen through direct getter checks,
proxy-backed reads, unauthorized writes, or invalid handoff artifacts.

This slice should prove the end-to-end behavior that:

- every critical scope violation produces durable specialized evidence
- the scope boundary remains fail-closed while becoming fully reconstructable
- the operational read model can distinguish read, write, and handoff failures
  consistently
- step-scope observability is complete without exposing protected runtime state

Implementation scope:

- instrument evidence emission for proxy-based unauthorized reads from scoped
  `state` and scoped `inputs`
- instrument evidence emission for invalid handoff artifacts
- consolidate scope-evidence emission behind a small helper so the module does
  not keep duplicating evidence writes inline
- add tests covering each violation path and read-model visibility

## User stories covered

- 21, 22, 33, 34, 46, 48, 53, 55

## Acceptance criteria

- [x] Every critical `Step Scope` violation path emits durable `scope` policy evidence.
- [x] The operational read model can distinguish unauthorized read, unauthorized write, and invalid handoff outcomes for scope failures.
- [x] Evidence emission remains redaction-safe and does not expose protected runtime payloads.
- [x] Focused tests cover proxy-based read violations and invalid handoff evidence in addition to existing scope checks.

## Blocked by

None - can start immediately.
