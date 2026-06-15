---
title: Solution Breath Section
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-11
---

# Solution Breath Section

## Parent

- `docs/live/prd/cultiv-product-showcase-restructure.md`
- `docs/live/prd/issue-product-showcase-restructure.md`

## User stories covered

8, 9, 10, 27, 40

## What to build

Deliver the **Solution Breath** section: handwritten brand note, centered Cultiv name, fixed subtitle, and four interactive **Solution Keywords** in an organic constellation layout.

This vertical slice proves end-to-end that:

- the handwritten note (*Não se constrói uma voz. Cultiva-se.*) appears above the Cultiv display name
- four keywords (**Voz**, **Memória**, **Formato**, **Escala** / locale equivalents) float asymmetrically—not a rigid orbit or SaaS chip row
- hover on desktop and tap on mobile reveal one-line micro-copy below each keyword balloon
- balloons use editorial material (`surface-elevated`, subtle border, optional `paper-grain`) with zero border-radius
- section has generous vertical space (`~70vh` feel) on `surface-elevated` background
- keywords are keyboard-operable with visible focus and aria labels where needed

## Acceptance criteria

- [ ] `#solucao` section renders on both locales.
- [ ] Micro-copy is hidden by default and shown on interaction without layout shift that breaks the breath rhythm.
- [ ] No tooltip-only pattern that is unreachable on touch devices.
- [ ] Section does not duplicate the full differentiator copy; it stays poetic and minimal.

## Blocked by

- `10-message-catalogs-seo-geo.md`
- `11-hero-and-page-shell.md`
- Visual asset A03 approved — [`visual-assets/product-showcase-asset-bible.md`](../web-structure/visual-assets/product-showcase-asset-bible.md)
