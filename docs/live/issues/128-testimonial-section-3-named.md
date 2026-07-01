---
title: "Testimonial Section (3 Named)"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Testimonial Section (3 Named)

## Parent

- `docs/landing-page-redesign/06-testemunhos-e-prova.md`

## User stories covered

- Visitante vê prova social de que o produto funciona
- Visitante confia no produto antes de pagar

## What to build

Rewrite the TestimonialSection to display 3 named testimonials with roles, replacing the single unnamed quote. Update the message catalog structure and component layout.

This vertical slice proves end-to-end that:

- `pt.ts` `testimonial` field is restructured from single quote to array of 3 testimonials:
  ```
  testimonials: [
    { quote: string, name: string, role: string },
    { quote: string, name: string, role: string },
    { quote: string, name: string, role: string },
  ]
  ```
- `TestimonialSection.tsx` renders 3 testimonial cards
- Each card shows: quote text, author name, author role
- Layout: 3-column grid on desktop, stacked on mobile
- Quotes are styled with large italic text (existing display-xl style)
- Names and roles are styled distinctly (terracotta for names)
- Section maintains warm paper background
- Placeholder testimonials used until real ones are collected

## Acceptance criteria

- [ ] 3 testimonial cards render (not 1)
- [ ] Each card has: quote, name, role
- [ ] Desktop: 3-column layout
- [ ] Mobile: stacked layout
- [ ] Quote text uses display typography (large, italic)
- [ ] Author name is visually distinct (terracotta color or bold)
- [ ] Author role is shown below name
- [ ] Section works with placeholder data
- [ ] No TypeScript errors
- [ ] Section is accessible (blockquote, cite attributes)

## Blocked by

- `117-landing-page-copy-pt-br.md`
