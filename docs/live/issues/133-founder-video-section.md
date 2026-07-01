---
title: "Founder Video Section"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: HITL
last_updated: 2026-06-30
---

# Founder Video Section

## Parent

- `docs/landing-page-redesign/05-launch-plan.md`
- `docs/landing-page-redesign/06-testemunhos-e-prova.md`

## User stories covered

- Visitante vê o founder explicando o produto
- Visitante confia no produto porque vê quem criou

## What to build

Create a section that embeds the founder demo video. This is HITL because it requires the founder to record the video first — the component can be built with a placeholder.

This vertical slice proves end-to-end that:

- `apps/web/src/marketing/sections/FounderVideoSection.tsx` renders:
  - Section title: "Como o Cultiv funciona" (from message catalog)
  - Video embed (YouTube unlisted or self-hosted)
  - Fallback: screenshot/thumbnail if video not yet available
  - CTA below video: "Começar grátis"
- Section is placed in `BelowFoldSections` after the interactive demo
- Video is responsive (16:9 aspect ratio)
- Video has proper loading (lazy, no autoplay)
- Section uses CartographySurface styling

## Acceptance criteria

- [ ] FounderVideoSection component exists
- [ ] Section renders video embed with 16:9 aspect ratio
- [ ] Video is lazy-loaded (no impact on initial page load)
- [ ] Section has title from message catalog
- [ ] Section has CTA below video
- [ ] Section works without video (placeholder state)
- [ ] Video is accessible (captions attribute, title)
- [ ] Section is placed after interactive demo in page flow
- [ ] Mobile layout is responsive
- [ ] No layout shift when video loads

## Blocked by

- `120-hero-section-rewrite.md`
- `123-interactive-demo-section-integration.md`

## Notes

- Video recording is a separate task (founder records 3-5 min screen recording)
- Component should work with placeholder until video is ready
- Video URL can be configured via message catalog or env variable
