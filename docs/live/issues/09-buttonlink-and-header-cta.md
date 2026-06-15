---
title: ButtonLink and Header Waitlist CTA
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# ButtonLink and Header Waitlist CTA

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

2, 23, 33

## What to build

Add `ButtonLink` to the shared **Design System** and wire the **Product Showcase** header for conversion.

This vertical slice proves end-to-end that:

- `ButtonLink` renders an anchor with the same visual variants as `Button` (`primary`, `ghost`, `invert`)
- the site header exposes a compact primary **Waitlist** CTA linking to `#waitlist` on desktop
- the mobile navigation exposes the same **Waitlist** CTA without opening the menu (beside the menu trigger)
- anchor CTAs remain keyboard-focusable with visible focus styles from existing **Design System** patterns

## Acceptance criteria

- [ ] `ButtonLink` is exported from `@my-ai-orchestrator/ui` and used in `SiteHeader` / `SiteMobileNav`.
- [ ] Header CTA navigates to `#waitlist` on both locales.
- [ ] No regression to locale toggle or brand link behavior.
- [ ] `Button` behavior for forms (waitlist submit) is unchanged.

## Blocked by

None — can start immediately.
