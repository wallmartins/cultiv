---
title: Voice Development Presentation
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Voice Development Presentation

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

2, 6

## What to build

Extend **Voice Reasoning Presentation** on **Voice Dashboard** with a second hero block for **Argument Development Signature**.

Deliver:

- Hero block 1 (existing): **Core Reasoning Signature** — “how I think”
- Hero block 2 (new): **Argument Development Signature** — “how I develop a text” with `developmentProse` and sentence-case trait chips (moves, epistemic posture)
- **Format Expression Profile** and anti-patterns remain in **Voice Dashboard Detail Layer** disclosures
- States: immature (&lt;3 examples) with explanatory copy; rebuild in progress; omit block gracefully on failed/missing data (no crash)
- i18n pt-BR + en via app message catalogs
- SDK consumes new profile screen fields from issue 74

No reconciliation conflict UI. No manual edit controls.

## Acceptance criteria

- [ ] Dashboard renders second hero when development signature exists and flag on.
- [ ] Immature state shows when &lt;3 active examples with localized copy.
- [ ] Move labels and posture render as sentence-case chips (not uppercase mono diagnostic labels).
- [ ] Rebuild failed / missing development: page does not crash; core hero still renders.
- [ ] Component tests for hero, immature, and loading states.
- [ ] pt-BR and en strings present for new copy keys.

## Blocked by

- [74-argument-development-contracts-persistence.md](./74-argument-development-contracts-persistence.md)
- [76-voice-signature-divergence-reconciliation.md](./76-voice-signature-divergence-reconciliation.md)
