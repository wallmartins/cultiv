---
title: Development Traits Generation Pass-Through
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Development Traits Generation Pass-Through

## Parent

- [`development-traits-and-author-confidence.md`](../prd/development-traits-and-author-confidence.md)
- [`issue-development-traits.md`](../prd/issue-development-traits.md)
- [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md)

## User stories covered

8 (backend engineer — traits reach execution without extra LLM calls)

Extends product value of traits beyond dashboard: generation can use reconciled structured signals when `developmentProse` alone is ambiguous.

## What to build

Wire reconciled **Development Trait Profile** from profile storage through voice hints, effective resolution, snapshots, and step-scoped development prompts — without replacing `developmentProse` as the primary generation guidance.

Deliver end-to-end:

- **Voice hints & merge:** `buildVoiceHints` and `mergeVoiceProfile` pass `traitProfile` when flag on and profile has traits; flag off strips traits (mirror issue 77 pattern for development fields)
- **Effective resolution:** `resolveEffectiveVoice` includes trait profile in execution context; snapshot `appliedSignals` records development trait summary (e.g. `developmentTraitsApplied: true`, key enum values such as `openingMode`, `closingMode`, `insightTiming` — extend `VoiceSignalSummary` per contracts)
- **Step-scoped prompt extension:** extend `== ARGUMENT DEVELOPMENT ==` block (issue 78) with optional compact trait summary line when `traitProfile` present:
  - Structural steps (`hook`, `outline`, `structure`, `draft`, `expand`): one-line summary of high-confidence traits only (`confidence: high` or `confirmed`); omit `unknown` / `disputed` traits from prompt
  - Refinement steps (`refine`, `tighten`): no trait line (posture + structural anti-patterns only, unchanged)
- **Prompt format example:** `Development traits (confirmed): opening=observation; insight=late; closing=open_question`
- `developmentProse`, moves, and transitions remain primary content in the development block; trait line is additive guardrail
- Regression: traits survive hints merge; prompt snapshots with and without `traitProfile`; flag-off identical to pre-87 behavior

## Acceptance criteria

- [ ] `mergeVoiceProfile` preserves `traitProfile` — regression test mirroring Core/development merge pattern.
- [ ] Integration: rebuild with traits → `resolveEffectiveVoice` → execution step context includes `traitProfile`.
- [ ] Snapshot `appliedSignals` includes development trait fields when traits applied and flag on.
- [ ] Prompt snapshot (structural step): `== ARGUMENT DEVELOPMENT ==` contains prose + optional trait summary when high-confidence traits exist.
- [ ] Prompt snapshot (structural step): `unknown` and `disputed` traits excluded from prompt line.
- [ ] Prompt snapshot (refinement step): no trait summary line.
- [ ] Flag off: no trait fields in hints, snapshots, or prompts.
- [ ] No additional LLM calls introduced.

## Blocked by

- [83-development-traits-extraction-confidence.md](./83-development-traits-extraction-confidence.md)
- [84-trait-aware-divergence-reconciliation.md](./84-trait-aware-divergence-reconciliation.md)
- [77-development-voice-hints-resolution.md](./77-development-voice-hints-resolution.md)
- [78-step-scoped-development-prompts.md](./78-step-scoped-development-prompts.md)

## Notes

- Evaluated separately from dashboard mirror (issue 85) so generation benefit can ship or iterate independently.
- **Argument Development Drift v2** heuristics keyed on traits remain out of scope — follow-on after trait regression corpus stabilizes.
