---
title: Billing PostgreSQL Persistence
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Billing PostgreSQL persistence

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Replace in-memory `createBillingRepository()` with **PostgreSQL-backed** billing storage linked to **Application User** ids.

Persist at minimum:

- plan definitions (seed/migration)
- subscriptions
- ledger entries
- generation reservations (reserve / capture / release)
- idempotency keys for billing operations
- cycle state required by `startCycle` / wallet derivation

Wire `createBackendProductDependencies` to use Postgres billing repository when `DATABASE_URL` is set. Preserve existing `packages/payments` service API; swap repository implementation.

## Acceptance criteria

- [ ] Migration adds billing tables with indexes on `user_id`, `account_id`, reservation status.
- [ ] `ensureDefaultFreeSubscription` writes durable rows; survives process restart in integration test.
- [ ] `reserveGenerationCredits` / `captureReservedCredits` / release paths durable and auditable.
- [ ] Existing `tests/payments` adapted or duplicated against PG repository.
- [ ] No `Map` subscription/ledger store in runtime bootstrap.

## Blocked by

- 48
