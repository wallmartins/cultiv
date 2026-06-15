---
title: Message Catalogs, SEO, and GEO Realignment
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Message Catalogs, SEO, and GEO Realignment

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

24, 25, 26, 30, 36

## What to build

Expand typed **Marketing Locale** message catalogs for the restructured **Product Showcase** and align SEO/GEO metadata with the new hero positioning.

This vertical slice proves end-to-end that:

- `LocaleMessages` includes namespaces for hero, problem, solution breath, differentiators, use cases, product flow, social proof, and updated header navigation labels
- `pt.ts` and `en.ts` ship full copy parity for all new namespaces
- SEO title follows `Cultiv — Textos que soam como você` / `Cultiv — Text that sounds like you`
- meta description, OG alt, `geo` product definition, `llms.txt` builders, and JSON-LD home graph reflect the new narrative
- `marketing-nav-items.ts` uses the new anchor keys (problem, differentiators, use cases, waitlist)
- `tests/web/i18n-catalog.test.ts` enforces pt/en key parity for expanded catalogs
- `tests/web/geo.test.ts` passes with updated expectations

## Acceptance criteria

- [ ] TypeScript fails if pt/en message keys diverge.
- [ ] Home page head metadata uses the new title and description per locale.
- [ ] Navigation label strings come from message catalogs, not hardcoded literals.
- [ ] GEO/llms summaries no longer center "authenticity at scale" as the primary tagline.
- [ ] Legacy namespaces (`about`, `formats`, `method`) are removed or marked for removal only after dependent sections are migrated (coordinate with later issues).

## Blocked by

None — can start immediately (may land before section components exist; strings must be ready for issues 11–15).

**Graphics note:** OG image spec is A10 in [`visual-assets/`](../web-structure/visual-assets/); copy `a10-og-share.svg` to public after approval.
