---
title: Active AI Policy Pointer Persistence And Read Path
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Active AI Policy Pointer Persistence And Read Path

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that introduces a persisted **Active AI Policy Pointer** so the
backend can determine which published `policyVersion` new previews and
executions should use without requiring a deploy.

This slice should prove the end-to-end behavior that:

- the active policy version is stored in operational persistence rather than
  inferred from deploy-time config alone
- preview and execution read the active pointer before resolving policy
- policy artifacts stay immutable while the pointer remains operationally
  mutable

## Acceptance criteria

- [ ] The backend can persist and read the active `policyVersion` through a dedicated operational pointer model.
- [ ] New previews and executions resolve policy through the active pointer rather than only through static boot configuration.
- [ ] Published policy artifacts remain immutable and distinct from the persisted active pointer state.

## Blocked by

- `01-routing-profile-schema-and-boot-validation.md`
