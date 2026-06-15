---
title: Operational Degradation Recommendation For Future Policy Switches
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Operational Degradation Recommendation For Future Policy Switches

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that produces an operational recommendation when provider
degradation suggests moving future traffic to another published
`policyVersion`, while keeping activation human-approved and leaving the
current request to automatic fallback.

This slice should prove the end-to-end behavior that:

- degraded provider behavior can produce a recommendation signal for operators
- the signal is based on runtime evidence rather than route-level assumptions
- no activation happens automatically from that signal

## Acceptance criteria

- [ ] Observed provider degradation can produce an operational recommendation to evaluate another published `policyVersion`.
- [ ] The recommendation does not interfere with automatic fallback for the current request.
- [ ] No new policy version is activated automatically from the recommendation path.

## Blocked by

- `06-provider-trace-and-telemetry-parity-for-new-routing-model.md`
- `09-internal-policy-activation-api-and-audit-trail.md`
