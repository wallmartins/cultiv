---
title: "Landing Page Copy Rewrite (en)"
doc_type: issue
status: ready-for-agent
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-30
---

# Landing Page Copy Rewrite (en)

## Parent

- `docs/landing-page-redesign/00-visao-geral.md`
- `docs/landing-page-redesign/03-copy-e-textos.md`

## User stories covered

- English-speaking visitor understands the product in seconds
- English-speaking visitor sees pricing without hunting

## What to build

Mirror the pt-BR copy rewrite in the English message catalogs. This issue is AFK because the copy decisions were already made in the pt-BR issue — this is a translation with locale-appropriate adaptations.

This vertical slice proves end-to-end that:

- `apps/web/src/i18n/marketing/locales/en.ts` contains updated copy matching every section changed in pt-BR
- Navigation items: "How it works", "Pricing", "Questions", "Logbook"
- Hero: "Paste 5 of your texts. See how you actually write." + metrics subheadline + "Start for free" CTA + microcopy
- Problem: "Everyone is publishing the same text." with 3 cards
- How it works: "In 5 steps, your writing becomes a voice profile"
- Comparison: 3-column table with localized headers
- Pricing: "Build your profile for free. Pay when you're ready to generate." with $9/$19/$39 tiers
- Testimonials: 3 placeholders matching pt-BR structure
- FAQ: 6 items with English answers
- Launch CTA: "Paste your texts. See how you write. Generate with your signature."
- Footer: "Your text should have your coordinates, not ChatGPT's." + share prompt
- SEO: English homeTitle and homeDescription

## Acceptance criteria

- [ ] Every section in `en.ts` matches the pt-BR structure exactly (same keys, same array lengths)
- [ ] All copy is natural English, not literal PT-BR translation
- [ ] Pricing amounts are in USD ($9/$19/$39)
- [ ] Hero headline is ≤10 words
- [ ] No placeholder text like "[Em breve]" — use English equivalents or "Coming soon"
- [ ] SEO meta description ≤160 chars
- [ ] No TypeScript errors

## Blocked by

- `117-landing-page-copy-pt-br.md`
