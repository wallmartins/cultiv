---
title: Content Catalog Availability Model
doc_type: issue
status: done
domain: billing
slice_type: AFK
last_updated: 2026-06-12
---

# Content catalog availability model

## Parent

- [`issue-plan-tier-quality-modes.md`](../prd/issue-plan-tier-quality-modes.md)
- ADR: [`0002-plan-tier-quality-modes-and-default-free-subscription.md`](../../adr/0002-plan-tier-quality-modes-and-default-free-subscription.md)

## User stories covered

5, 6, 7, 17

## What to build

Change **Content Type** catalog availability so **plan tier does not block formats**. All catalog items are selectable for users with an **active subscription**.

End-to-end behavior:

- `buildContentTypeCatalogView` sets `available: true` when entitlement exists and `status === "active"`.
- Remove use of `canRefine` (language refinement) from catalog availability.
- `reasonCode` when unavailable reflects subscription state (e.g. inactive / missing entitlement), not format tier.
- `/me/content-types` and preview `options.contentTypes` stay consistent.
- Free-tier user with active subscription sees every format enabled in API responses.

Update `docs/live/plan/web-v2-screen-specs.md` § Generation (content type selector) to state formats are not plan-gated; link ADR 0002.

## Acceptance criteria

- [ ] Free-tier user with active subscription: all catalog items `available: true` in `/me/content-types` test.
- [ ] Inactive subscription: items not available with subscription-related reason (not `feature_flag_disabled` from `canRefine`).
- [ ] No code path uses `canRefine` to compute `ContentTypeCatalogItemView.available`.
- [ ] Screen spec updated for format-open model.

## Blocked by

- [35-default-free-subscription-jit.md](./35-default-free-subscription-jit.md)
