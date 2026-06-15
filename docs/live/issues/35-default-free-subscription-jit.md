---
title: Default Free Subscription on JIT
doc_type: issue
status: done
domain: billing
slice_type: AFK
last_updated: 2026-06-12
---

# Default free subscription on JIT

## Parent

- [`issue-plan-tier-quality-modes.md`](../prd/issue-plan-tier-quality-modes.md)
- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)

## User stories covered

1, 2, 3, 4, 17

## What to build

Ensure every **Application User** receives a default **`free` billing subscription** when provisioned through JIT auth, so `getEntitlement` never returns `undefined` for a normal authenticated user.

End-to-end behavior:

- First authenticated request creates **Application User** (existing) **and** upserts `free` subscription with `status: "active"` (idempotent on repeat logins).
- Billing cycle / wallet initialization runs when required by the payments service (mirror `seedUserBillingState` semantics without relying on `billingUserId` config).
- `getEntitlement(userId)` returns tier `free`, plan `free`, and wallet reflecting `monthlyCredits` (50) for new users.
- Existing users with subscriptions are not duplicated or downgraded.

Expose a small payments API surface (e.g. `ensureDefaultFreeSubscription`) callable from the auth layer without coupling payments to HTTP.

## Acceptance criteria

- [ ] New JIT user has active `free` subscription and resolvable entitlement in tests.
- [ ] Repeat login does not create duplicate subscriptions or reset consumed credits unexpectedly.
- [ ] `ensureDefaultFreeSubscription` (or equivalent) is idempotent and covered by `tests/payments`.
- [ ] Auth integration test or backend app test proves entitlement after first `/me/*` request without manual `upsertSubscription` in the test (except plan registration bootstrap).

## Blocked by

None — can start immediately.
