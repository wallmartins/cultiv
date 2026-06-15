# Billing Policy Versioning and Model Routing

## Status

Accepted

## Context

The backend needs to stay model-agnostic while still controlling cost, quality, and auditability across different plan tiers. We also need legal-safe billing behavior, so executions already started cannot be repriced retroactively when billing policy changes.

## Decision

Billing policy lives in `packages/payments` and is persisted in the database. Credit pricing is defined by `planTier + qualityMode`, reservations happen before generation starts, capture/release happens after generation ends, and each plan carries an explicit `policyVersion`.

When billing policy changes, we create a new plan record or policy version and retire the previous one for new signups. Executions already started stay bound to the policy version that was active when they began.

## Consequences

- billing stays auditable and legally safer
- the backend can swap providers and models without changing the commercial billing contract
- historical executions remain reproducible against the policy version they used
- model routing becomes a runtime resolution problem, not a route-level concern
