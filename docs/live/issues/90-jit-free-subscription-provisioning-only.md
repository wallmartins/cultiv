---
title: JIT Free Subscription at Provisioning Only
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# JIT Free Subscription at Provisioning Only

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- ADR 0002 (default free subscription on JIT)
- Prior: issue 35

## What to build

Move **`ensureDefaultFreeSubscription`** out of the per-request auth path (`resolvePublicActor` in auth-middleware) and invoke it only when a new **Application User** is provisioned on first JWT resolution.

Existing users with subscriptions must not trigger billing writes on every authenticated GET/POST. Read paths stay read-only for billing.

## Acceptance criteria

- [ ] New user first login creates free subscription row (existing JIT test still passes).
- [ ] Subsequent requests for same user do not call `ensureDefaultFreeSubscription`.
- [ ] Suspended-user blocking unchanged.
- [ ] Test asserts billing service not invoked on second auth resolution for same user.

## Blocked by

None — can start immediately.
