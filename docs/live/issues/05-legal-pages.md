---
title: Legal Pages
doc_type: issue
status: done
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-09
---

# Legal Pages

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

15

## What to build

Publish bilingual legal pages required for **Waitlist** consent and LGPD compliance.

This vertical slice proves end-to-end that:

- privacy policy renders at `/privacy` (pt-BR) and `/en/privacy` (en)
- terms of service render at `/terms` (pt-BR) and `/en/terms` (en)
- pages use MarketingLayout or a minimal legal layout consistent with **Design System**
- footer and **Waitlist** consent links resolve to the correct locale-specific privacy page
- legal content covers data collected via **Waitlist Submission**, Loops as processor, and contact information

## Acceptance criteria

- [ ] All four legal routes render without errors.
- [ ] Privacy pages describe email/name collection, Loops forwarding, and user rights.
- [ ] Footer links from the marketing shell reach the correct legal page per **Marketing Locale**.
- [ ] Legal pages are reachable in both locales from the showcase footer.

## Blocked by

- `02-marketing-shell-bilingual-routes.md`
