---
title: Legacy Removal and Quality Gate
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Legacy Removal and Quality Gate

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

22, 29, 21, 26, 27

## What to build

Remove legacy **Product Showcase** sections, finalize FAQ placement, and pass the quality gate for the restructured marketing page.

This vertical slice proves end-to-end that:

- `AboutSection`, `FormatsSection`, and horizontal three-sample `ShowcaseSection` are removed from the home scroll
- unused components and i18n keys (`about`, `formats`, `method`, hero chip/slogan) are deleted
- `FaqSection` renders below `WaitlistSection` and is removed from primary navigation
- `GeoCitationBlock` tied to the old about section is removed or relocated appropriately
- `cultiv-og.svg` text matches the new headline if it embeds marketing copy
- governance, i18n, geo, and showcase tests pass
- Lighthouse Performance and Accessibility remain ≥ 90 on `/` and `/en`

## Acceptance criteria

- [ ] Home scroll contains only the new section sequence (no `#about`, `#formats`, legacy `#showcase` carousel).
- [ ] FAQ is the last editorial block before the footer.
- [ ] No dead imports or orphaned locale keys remain.
- [ ] `tests/governance/frontend-client-boundary.test.ts` still passes.
- [ ] Manual QA checklist from the implementation plan is satisfied (anchors, reduced motion, modal a11y).

## Blocked by

- `12-problem-section-and-scenes.md`
- `13-solution-breath-section.md`
- `14-use-cases-flow-and-social-proof.md`
- `15-differentiator-chapters-and-teaser.md`
