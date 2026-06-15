---
title: Plan Tier Quality Modes
doc_type: issue
status: ready-for-agent
domain: billing
slice_type: AFK
last_updated: 2026-06-12
---

# Plan tier quality modes and default free subscription

## Parent

- PRD: [`plan-tier-quality-modes.md`](./plan-tier-quality-modes.md)
- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)
- Plan: [`../plan/plan-tier-quality-modes-implementation-plan.md`](../plan/plan-tier-quality-modes-implementation-plan.md)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## User stories covered

1–21 (full PRD)

## What to build

Realign commercial gating so **Content Types** are never plan-blocked, **Quality Modes** are tier-gated, and every **Application User** has a default **`free` subscription** with normal **active** status.

This program proves end-to-end that:

- JIT auth provisions billing state; `getEntitlement` works for real users without dev seed
- free-tier users see all formats and only **fast** mode enabled
- pro-tier users see all modes when credits allow
- zero-credit users see formats but cannot generate
- preview and execution enforce the same rules
- **Generation Screen** disables unavailable modes with localized reasons

**Out of program scope:** billing checkout, new plan SKUs, per-tier pricing changes, **Billing Surface**.

## Child issues

| # | Issue | Type | Blocked by |
|---|-------|------|------------|
| 35 | [Default free subscription on JIT](../issues/35-default-free-subscription-jit.md) | AFK | — |
| 36 | [Quality mode tier entitlements](../issues/36-quality-mode-tier-entitlements.md) | AFK | 35 |
| 37 | [Content catalog availability model](../issues/37-content-catalog-availability-model.md) | AFK | 35 |
| 38 | [Generation screen commercial UX](../issues/38-generation-screen-commercial-ux.md) | AFK | 36, 37 |

**Suggested order:** 35 → (36 ∥ 37) → 38

## Acceptance criteria

- [ ] ADR 0002 accepted; PRD and plan linked from issues README
- [ ] All child issues meet their acceptance criteria
- [ ] `docs/live/plan/decisions.md` reflects format-open / mode-gated model
- [ ] Backend and web tests cover free vs pro mode gating and JIT subscription
