---
title: Showcase Samples Catalog
doc_type: issue
status: done
domain: marketing-surface
slice_type: HITL
last_updated: 2026-06-09
---

# Showcase Samples Catalog

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

6, 7, 8, 17, 26, 29

## What to build

Deliver the core proof section of the **Product Showcase**: three curated **Showcase Samples** per **Marketing Locale**, each demonstrating generic AI output vs voice-aligned output for the same briefing.

This vertical slice proves end-to-end that:

- **Showcase Content Catalog** stores typed samples separate from UI components
- exactly three samples ship per locale: blog post, LinkedIn post, thread (**Content Types**)
- ShowcaseSection renders samples using ComparisonCard with side-by-side generic vs voice-aligned outputs
- each card shows index label, format name, briefing summary, and both outputs
- copy is manually curated per locale — not auto-translated
- a domain expert reviews sample quality before merge (HITL gate)

Sample record shape:

```typescript
type ShowcaseSample = {
  readonly id: string
  readonly contentTypeLabel: string
  readonly index: string
  readonly briefing: string
  readonly genericOutput: string
  readonly voiceOutput: string
}
```

## Acceptance criteria

- [ ] Three **Showcase Samples** render on `/` and three equivalent samples on `/en`.
- [ ] Each sample contrasts generic and voice-aligned output for the same briefing.
- [ ] Content types covered: blog post, LinkedIn post, thread.
- [ ] Showcase content lives in typed catalog modules, not embedded in section JSX.
- [ ] Layout remains readable on mobile (375px) with stacked comparison columns.
- [ ] Domain expert sign-off on curated copy in both locales (HITL).

## Blocked by

- `02-marketing-shell-bilingual-routes.md`
