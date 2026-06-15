---
title: Runtime Policy Reload Across Multiple Instances
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Runtime Policy Reload Across Multiple Instances

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that allows multiple backend instances to converge on the
active `policyVersion` in runtime through controlled reload and short eventual
consistency, without changing already started previews or executions.

This slice should prove the end-to-end behavior that:

- each instance can refresh the active pointer without a deploy
- newly arriving requests eventually use the newly active `policyVersion`
- already resolved previews and executions remain pinned to the version they
  already captured

## Acceptance criteria

- [ ] Backend instances can reload the active `policyVersion` in runtime without a redeploy.
- [ ] New requests eventually converge on the newly active version while already started work remains pinned to its resolved version.
- [ ] The reload model is covered by tests that verify safe eventual-consistency assumptions rather than implementation details of caching.

## Blocked by

- `07-active-ai-policy-pointer-persistence-and-read-path.md`
