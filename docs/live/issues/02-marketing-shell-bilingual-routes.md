---
title: Marketing Shell and Bilingual Routes
doc_type: issue
status: done
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-09
---

# Marketing Shell and Bilingual Routes

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

1, 2, 3, 4, 15 (navigation links only)

## What to build

Deliver the **Marketing Surface** shell with bilingual routing so visitors can land on Portuguese (default) or English URLs and navigate between equivalent pages.

This vertical slice proves end-to-end that:

- Portuguese (Brazil) is the default **Marketing Locale** at `/`
- English **Marketing Locale** is served at `/en`
- MarketingLayout wraps the **Product Showcase** as a single scroll page per locale
- SiteHeader includes Cultiv identity and LocaleToggle
- LocaleToggle navigates between equivalent routes (e.g. `/` ↔ `/en`) without losing anchor context where possible
- FooterSection exposes locale toggle, contact placeholder, and links to legal routes (routes may 404 until issue 05)
- the page structure supports anchored sections for the full editorial scroll experience

## Acceptance criteria

- [ ] `/` renders a Portuguese marketing page inside MarketingLayout.
- [ ] `/en` renders an English marketing page inside MarketingLayout.
- [ ] LocaleToggle switches between `/` and `/en` for the showcase page.
- [ ] Header and footer use **Design System** components and tokens.
- [ ] Layout is responsive at mobile, tablet, and desktop breakpoints.

## Blocked by

- `01-design-system-and-web-scaffold.md`
