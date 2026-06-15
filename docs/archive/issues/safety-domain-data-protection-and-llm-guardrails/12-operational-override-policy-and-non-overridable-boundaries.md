---
title: Operational Override Policy And Non-Overridable Boundaries
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Operational Override Policy And Non-Overridable Boundaries

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that introduces controlled safety override through the
**Operational API Surface** only, with explicit **Platform Admin**
authorization, one-shot semantics by default, narrowly-scoped short-lived
exceptions for true emergencies, and absolute refusal for non-overridable
decisions such as prohibited data, exfiltration, secrets, or broken
**Step Scope** isolation.

This slice should prove the end-to-end behavior that:

- public clients cannot bypass safety through administrative-looking flags
- override authority is narrower than ordinary operational identity and requires
  explicit permission, justification, and scope
- one-shot is the default override mode and time-limited exceptions expire
  automatically when explicitly allowed
- some safety decisions remain impossible to override for product and compliance
  reasons

Implementation scope:

- expose override only on the **Operational API Surface**, never the public one
- require explicit **Platform Admin** authorization plus justification, target
  scope, and intended lifetime for every override request
- implement policy evaluation that distinguishes one-shot overrides from rare
  time-limited overrides and rejects standing broad bypasses
- encode non-overridable decision families in the canonical safety policy so the
  override path cannot bypass prohibited data, secret leakage, exfiltration, or
  broken scope-isolation boundaries
- emit both **Policy Evidence** and **Audit Trail** records for accepted and
  rejected override attempts

## User stories covered

- 21, 23, 24, 25, 26, 27, 28, 29, 46

## Acceptance criteria

- [ ] Safety override is available only through the **Operational API Surface** and never through public product routes.
- [ ] Override requests require explicit **Platform Admin** permission, justification, declared scope, and lifecycle semantics.
- [ ] One-shot override is the default behavior, and any time-limited override expires automatically according to explicit policy.
- [ ] Non-overridable boundary outcomes remain blocked even when an operator requests override.
- [ ] Accepted and rejected override attempts both emit durable **Policy Evidence** and **Audit Trail** records.

## Blocked by

- `03-instruction-override-attempt-detection-and-decisioning.md`
- `05-step-scope-contracts-and-handoff-validation.md`
- `07-output-release-gate-for-technical-and-sensitive-content.md`
- `10-policy-evidence-persistence-and-operational-read-model.md`
