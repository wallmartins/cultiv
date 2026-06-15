---
title: Policy Activation Safety Through Preview And Quote Semantics
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Policy Activation Safety Through Preview And Quote Semantics

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that preserves safe preview and execution behavior when the
active `policyVersion` changes, ensuring that policy activation affects only
future requests while stale previews remain guarded by quote mismatch
semantics.

This slice should prove the end-to-end behavior that:

- preview can be resolved against one active version and execution can reject a
  stale commercial snapshot after activation
- already started work stays pinned to its resolved version
- activation does not silently mutate a request that already received a preview

## Acceptance criteria

- [ ] A preview resolved under one `policyVersion` fails explicitly at execution time when activation changed the commercial snapshot.
- [ ] Quote mismatch remains the public safety boundary between stale preview state and newly active policy state.
- [ ] Activation affects only new previews and executions, not executions already shaped by a prior resolved snapshot.

## Blocked by

- `08-runtime-policy-reload-across-multiple-instances.md`
- `09-internal-policy-activation-api-and-audit-trail.md`
