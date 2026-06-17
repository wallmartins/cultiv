---
title: Author Development Mirror Dashboard
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Author Development Mirror Dashboard

## Parent

- [`development-traits-and-author-confidence.md`](../prd/development-traits-and-author-confidence.md)
- [`issue-development-traits.md`](../prd/issue-development-traits.md)
- [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md)

## User stories covered

1, 2, 3, 5, 6

## What to build

Extend **Voice Reasoning Presentation** second hero (“how I develop a text”) with the **Author Development Mirror**: **Development Traits strip**, confidence indicators, Core authority cross-link, and **Trait Evidence** in the detail layer.

Deliver end-to-end:

- Traits strip below `developmentProse`: opening, perspective shifts, counterexamples, self-questioning, insight timing, analogies, closing — sentence-case labels, not uppercase mono diagnostic styling
- Confidence indicators: high / medium / low (●●● / ●●○ / ●○○) per trait from `TraitRecord.confidence`
- `unknown` traits: em dash + localized gap copy (“Ainda não dá para inferir…”)
- Link to Core hero chip for `authoritySource` — do not duplicate validation as a Development trait chip
- Immature development (&lt;3 examples): trait confidence visually capped + existing `developmentImmature` copy
- Collapsible **Trait Evidence** in **Voice Dashboard Detail Layer**: ≤200 char excerpts, content type label, link to example management
- Graceful degrade when `traitProfile` absent (issue 81 hero still works)
- i18n pt-BR + en for all new copy keys
- Component tests: strip render, unknown state, immature cap, missing `traitProfile`, evidence disclosure

No confirmation card in this slice (issue 86). No manual edit controls.

## Acceptance criteria

- [ ] Dashboard renders traits strip when `traitProfile` present and `voice.reasoningSignatureV1` on.
- [ ] Unknown traits never show invented enum labels.
- [ ] Core authority link navigates/focuses Core chip or scrolls to Core hero.
- [ ] Evidence disclosure shows excerpts for traits with `evidenceExampleIds`.
- [ ] Page does not crash when `traitProfile` absent or rebuild failed.
- [ ] pt-BR and en strings present; component tests pass.

## Blocked by

- [82-development-traits-contracts-persistence.md](./82-development-traits-contracts-persistence.md)
- [84-trait-aware-divergence-reconciliation.md](./84-trait-aware-divergence-reconciliation.md)
- [81-voice-development-presentation.md](./81-voice-development-presentation.md)
