---
title: Internal Policy Activation API And Audit Trail
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Internal Policy Activation API And Audit Trail

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that exposes an internal operational path to inspect published
policy versions, inspect the active version, and activate a new version with
human approval and audit metadata, without exposing routing control to public
clients.

This slice should prove the end-to-end behavior that:

- operators can inspect the active and available `policyVersion` values
- a new published version can be activated without editing policy contents in
  persistence
- activation records the actor and timestamp for later audit

## Acceptance criteria

- [ ] The backend exposes an internal operational path to list published versions and read the currently active `policyVersion`.
- [ ] An approved operator can activate a published version without mutating the policy artifact body.
- [ ] Policy activation records actor and timestamp in an auditable operational trail.

## Blocked by

- `07-active-ai-policy-pointer-persistence-and-read-path.md`
- `08-runtime-policy-reload-across-multiple-instances.md`
