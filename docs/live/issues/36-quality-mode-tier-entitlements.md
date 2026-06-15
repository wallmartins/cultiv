---
title: Quality Mode Tier Entitlements
doc_type: issue
status: done
domain: billing
slice_type: AFK
last_updated: 2026-06-12
---

# Quality mode tier entitlements

## Parent

- [`issue-plan-tier-quality-modes.md`](../prd/issue-plan-tier-quality-modes.md)
- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)

## User stories covered

8, 9, 10, 12, 13, 16, 18, 19, 20, 21

## What to build

Implement **Quality Mode** gating by **plan tier** in `packages/payments` and enforce it in **Generation Preview** and **Generation Request** authorization.

Tier ladder:

```
free       → fast
starter    → fast, balanced
pro        → fast, balanced, strict
enterprise → fast, balanced, strict
```

End-to-end behavior:

- `resolveAllowedQualityModes(tier)` and `canUseQualityMode(entitlement, mode)` live in payments.
- `generation-preview` sets each `qualityModes[].allowed` only when: subscription active, mode allowed for tier, and `availableCredits >= creditPrice`.
- `blockedReason` distinguishes insufficient credits vs mode not in plan vs inactive subscription (extend contracts if needed).
- `public-generation` / `assertPublicGenerationAccess` validates quality mode against tier; remove using `canRefine` as a proxy for format or generation access.
- Preview recommendation continues to pick the best mode **within allowed modes** (existing `allowed_option_guard` behavior).
- Credit **pricing** unchanged across tiers.

## Acceptance criteria

- [ ] Free-tier integration test: preview allows only `fast`; `balanced`/`strict` have `allowed: false` with plan/mode reason.
- [ ] Pro-tier test: all modes allowed when credits suffice; only credit balance blocks when low.
- [ ] Direct generation with disallowed mode on free tier returns authorization error (fail closed).
- [ ] `canRefine` still only affects language refinement in execution paths (regression test or explicit assertion).
- [ ] Payments unit tests cover full tier ladder including `starter` and `enterprise` tiers.

## Blocked by

- [35-default-free-subscription-jit.md](./35-default-free-subscription-jit.md)
