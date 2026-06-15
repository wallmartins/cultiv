---
title: Sensitive Runtime Redaction And Secret-Safe Diagnostics
doc_type: issue
status: ready-for-agent
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Sensitive Runtime Redaction And Secret-Safe Diagnostics

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that applies runtime redaction semantics to logs, diagnostics,
and operational evidence views so secrets and protected data classes do not leak
through observability or object rendering, while still preserving useful
operational diagnosis.

This slice should prove the end-to-end behavior that:

- sensitive values are not emitted verbatim through normal logs or diagnostics
- redaction is policy-driven and tied to classification semantics rather than ad
  hoc string replacement
- evidence and audit surfaces stay useful without becoming a second persistence
  channel for protected payloads
- secret hygiene complements real protection controls instead of pretending to
  replace them

Implementation scope:

- define redaction semantics for secret-like values and protected classified
  fields that may appear in logs, traces, diagnostics, or evidence read models
- route safety-domain and runtime diagnostics through redaction-aware helpers so
  structured objects do not leak protected values through serialization
- integrate redaction with the evidence read model and operational diagnostics
  introduced by earlier slices
- keep the policy typed and centralized so new boundary records inherit the same
  redaction behavior
- verify that failures and traces remain actionable after redaction instead of
  collapsing into unusable noise

## User stories covered

- 19, 42, 43, 47, 50

## Acceptance criteria

- [ ] Logs, traces, and operational diagnostics redact protected values according to typed classification and redaction policy instead of ad hoc string matching.
- [ ] Secret-like runtime values and protected data classes do not leak through structured object rendering or evidence read models.
- [ ] Redaction preserves enough metadata for operators to understand what boundary failed and why without seeing the raw protected payload.
- [ ] The solution is explicitly complementary to storage protection and does not replace encryption or consent controls.
- [ ] Tests cover redacted diagnostics for input, consent, and output-related failures.

## Blocked by

- `01-safety-policy-foundation-and-boot-validation.md`
- `10-policy-evidence-persistence-and-operational-read-model.md`
