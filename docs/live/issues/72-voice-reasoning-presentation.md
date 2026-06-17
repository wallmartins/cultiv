---
title: Voice Reasoning Presentation on Dashboard
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-16
---

# Voice Reasoning Presentation on Dashboard

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

3

## What to build

Add **Voice Reasoning Presentation** to `/app/voice`: read-only display of inferred author reasoning.

Deliver:

- UI section below confidence/diagnostics: core narrative prose, human-readable enum labels, per-format expression cards, derived anti-patterns list
- States: rebuilding (in progress), extraction failed (explain last valid profile), partial (core only when format expression missing)
- Helper copy: refine by adding examples — no edit controls in Fase 1
- i18n pt-BR and en in app message catalogs
- Consume extended profile screen API from issue 66; workspace glass styling consistent with issue 44 dashboard

## Acceptance criteria

- [ ] Dashboard renders reasoning section when API returns core signature.
- [ ] Enums display localized labels, not raw enum keys.
- [ ] Per-format cards show only formats with stored expression profiles.
- [ ] Rebuild in-progress shows non-blocking banner; failed rebuild shows warm error without hiding last valid reasoning.
- [ ] Reduced motion and mobile layout acceptable; no new primary nav items.
- [ ] Feature flag off hides reasoning section entirely.

## Blocked by

- [66-reasoning-contracts-persistence.md](./66-reasoning-contracts-persistence.md)
- [67-reasoning-extraction-rebuild.md](./67-reasoning-extraction-rebuild.md)
