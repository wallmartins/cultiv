---
title: Editorial Sections and i18n
doc_type: issue
status: done
domain: marketing-surface
slice_type: AFK
last_updated: 2026-06-09
---

# Editorial Sections and i18n

## Parent

- `docs/live/prd/cultiv-marketing-surface-phase-1.md`

## User stories covered

5, 9, 10, 27, 30

## What to build

Compose the non-showcase editorial sections of the **Product Showcase** with typed bilingual message catalogs.

This vertical slice proves end-to-end that:

- typed **Message Catalog (i18n)** exists for pt and en with compile-time key safety
- HeroSection communicates Cultiv's promise using locale-appropriate copy
- MethodSection presents three steps (teach voice → pick format → generate) per **Marketing Locale**
- FaqSection renders 4–6 accordion entries covering product, pricing expectations, privacy, and **Waitlist**
- ProofSection (optional) shows curated trust metrics without false user-count claims
- user-facing terms follow domain-friendly labels (e.g. "Formato" instead of internal **Content Type** jargon in Portuguese)
- both `/` and `/en` showcase pages include these sections in scroll order

## Acceptance criteria

- [ ] Message catalogs exist for pt and en with matching required keys for hero, method, FAQ, and proof namespaces.
- [ ] Hero, Method, FAQ, and Proof sections render on both locale routes.
- [ ] FAQ accordion is keyboard accessible and uses the **Design System** Accordion pattern.
- [ ] No hardcoded UI strings remain in section components; copy flows from message catalogs.
- [ ] Method copy aligns with the future **Onboarding** narrative (voice → format → generate).

## Blocked by

- `02-marketing-shell-bilingual-routes.md`
