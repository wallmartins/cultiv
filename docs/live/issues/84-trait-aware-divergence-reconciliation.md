---
title: Trait-Aware Divergence and Reconciliation
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Trait-Aware Divergence and Reconciliation

## Parent

- [`development-traits-and-author-confidence.md`](../prd/development-traits-and-author-confidence.md)
- [`issue-development-traits.md`](../prd/issue-development-traits.md)
- [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md)

## User stories covered

8, 9

## What to build

Extend **Voice Signature Divergence Check** and **Voice Signature Reconciliation** so **Development Traits** stay coherent with **Core Reasoning Signature** and **Argument Development Signature** prose.

Deliver end-to-end:

- Deterministic divergence rules (ADR 0008):
  - `insightTiming: late` vs Core `conclusionPace: fast`
  - `openingMode: thesis` vs exploratory `epistemicPosture` with doubt-heavy moves
  - ≥2 traits with `status: disputed` after confidence pass
- Reconciliation prompt includes draft `traits` + `traitEvidence`; output harmonized `traitProfile` in unified signature result
- On reconciliation success: persist harmonized traits with Core and Development
- On reconciliation failure: keep last valid profile including last `traitProfile`
- Observability: existing reconciliation invoked/skipped/failed events include trait dispute reason codes where applicable
- Unit tests for new divergence rules; integration test: conflicting trait/Core fixtures invoke reconciliation once

No user-facing conflict UI.

## Acceptance criteria

- [ ] Agreeing trait/Core profiles skip reconciliation (third LLM call count unchanged).
- [ ] Conflicting fixtures trigger reconciliation and persist harmonized traits.
- [ ] Reconciliation failure retains previous `traitProfile` and marks diagnostics failed per existing patterns.
- [ ] Divergence unit tests cover all three new rule families.
- [ ] Rebuild integration test counts reconciliation invocations with trait disputes.

## Blocked by

- [83-development-traits-extraction-confidence.md](./83-development-traits-extraction-confidence.md)
- [76-voice-signature-divergence-reconciliation.md](./76-voice-signature-divergence-reconciliation.md)
