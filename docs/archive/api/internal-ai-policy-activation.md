---
title: Internal AI Policy Activation API
doc_type: api-reference
status: active
domain: ai-implementation
last_updated: 2026-05-26
---

# Internal AI Policy Activation API

This internal surface controls which published `policyVersion` is active for
new previews and executions.

## Public Boundary

- Public generation clients continue to use `/api/generation-preview` and
  `/me/*`.
- Public clients do not choose provider, model, routing profile, or active
  policy version.
- Policy activation affects only future previews and executions.
- Preview and execution safety still depends on quote mismatch semantics.

## Authentication And Authorization

- Internal policy routes live under `/api/internal/policies/*`.
- Requests must carry an authenticated actor identity.
- The actor must include permission `ai_policy.activate`.
- Activation audit persists the actor user id and timestamp in the active
  pointer history.

## Routes

### `GET /api/internal/policies`

Returns:
- available published policy versions
- current active pointer
- optional degradation recommendation for future human review

### `GET /api/internal/policies/active`

Returns:
- current active pointer
- available versions
- optional degradation recommendation

### `POST /api/internal/policies/activate`

Request body:

```json
{
  "policyVersion": "2026-04-01"
}
```

Behavior:
- validates the requested version exists
- updates the persisted active pointer
- records `updatedBy` and `updatedAt`
- does not mutate published policy artifacts

### `POST /api/internal/policies/reload`

Behavior:
- reloads the persisted active pointer into the current backend instance
- supports eventual consistency across multiple instances

## Operational Notes

- Automatic fallback for the current request is separate from future policy
  activation.
- Degradation recommendations do not auto-activate another version.
- Already resolved execution snapshots remain pinned to the version they
  captured before activation.
