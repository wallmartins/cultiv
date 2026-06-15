---
title: Generation Screen Commercial UX
doc_type: issue
status: done
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Generation screen commercial UX

## Parent

- [`issue-plan-tier-quality-modes.md`](../prd/issue-plan-tier-quality-modes.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §4
- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)

## User stories covered

11, 14, 15, 16, 18

## What to build

Update the **Generation Screen** so commercial limits appear on **Quality Mode Presentation**, not **Content Type** selection.

End-to-end behavior:

- Content type `AppSelect` no longer shows plan-blocked formats for normal free users (all enabled when API marks `available`).
- Quality mode radio buttons disable when `preview.options.qualityModes` reports `allowed: false`.
- Show localized helper for disabled modes (upgrade / plan restriction) vs insufficient credits in preview panel when relevant.
- When current selection becomes disallowed (plan or credits), auto-select the recommended allowed mode or the first allowed mode.
- `getBlockedReason` i18n covers new backend `blockedReason` values for modes and subscription state.
- Generate button remains disabled when selected mode is not allowed or preview says so.

## Acceptance criteria

- [ ] Free-tier mocked preview: only Direto radio enabled; others disabled with visible reason.
- [ ] Pro-tier mocked preview: all three modes enabled when allowed by API fixture.
- [ ] Content type selector does not append plan restriction suffix for formats on free tier fixture.
- [ ] Auto-fallback selects allowed mode when user had `balanced` selected and preview refreshes on free tier.
- [ ] App i18n parity (pt/en) for new blocked-reason strings.

## Blocked by

- [36-quality-mode-tier-entitlements.md](./36-quality-mode-tier-entitlements.md)
- [37-content-catalog-availability-model.md](./37-content-catalog-availability-model.md)
