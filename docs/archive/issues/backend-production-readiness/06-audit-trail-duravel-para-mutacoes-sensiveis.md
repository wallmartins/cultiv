---
title: Audit Trail Duravel Para Mutacoes Sensiveis
doc_type: issue
status: ready-for-agent
domain: backend-production
last_updated: 2026-05-28
---

# Audit Trail Duravel Para Mutacoes Sensiveis

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Persist an audit trail for sensitive backend changes in the same transaction
as the business write.

This slice should prove end-to-end behavior that:

- sensitive changes emit durable audit records
- audit and business state stay consistent under retries and restarts
- logs are not treated as the source of truth for sensitive operations

Implementation expectations for this slice:

- define which mutations are considered sensitive and therefore auditable
- treat account provisioning, permission changes, idempotent execution state
  changes, and any durable ownership change as sensitive unless explicitly
  excluded
- write audit entries inside the same repository transaction or unit of work as
  the business state mutation
- ensure audit records survive restart, replay, and duplicate request
  scenarios
- keep audit record shape stable enough to support later support and compliance
  queries
- include enough context in the audit record to identify the actor, affected
  resource, mutation type, and timestamp without requiring log correlation
- make the audit writer a dedicated deep module instead of spreading audit calls
  across route handlers
- keep the persistence boundary explicit so tests can assert durable behavior
  without depending on log output
- preserve idempotency semantics so repeated requests do not create duplicate
  audit rows for the same logical mutation
- avoid letting audit failures silently disappear when the business mutation
  succeeds
- keep audit writes compatible with the PostgreSQL-backed persistence layer
  introduced in issue 04 and the schema enforcement in issue 05
- keep the audit model usable for both product support and operational review
  without exposing provider internals or request headers directly

## Acceptance criteria

- [ ] Sensitive writes persist an audit event durably.
- [ ] Audit records are written in the same transaction as the state change.
- [ ] Duplicate or retried requests do not produce inconsistent audit state.
- [ ] Audit records remain queryable after restart through the durable persistence layer.
- [ ] The audit record captures actor, resource, mutation type, and timestamp for each sensitive change.
- [ ] Audit behavior is isolated enough to be tested through the persistence boundary.

## Blocked by

- `04-postgresql-sistema-de-registro.md`
