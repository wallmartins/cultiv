---
title: Development Traits Contracts and Persistence
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Development Traits Contracts and Persistence

## Parent

- [`development-traits-and-author-confidence.md`](../prd/development-traits-and-author-confidence.md)
- [`issue-development-traits.md`](../prd/issue-development-traits.md)
- [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md)

## User stories covered

7, 8

## What to build

Introduce durable types and storage for **Development Traits**, **Trait Confidence**, and **Trait Evidence** as an extension of **Argument Development Signature** on the **Derived Voice Profile**.

Deliver end-to-end:

- Contract types: `DevelopmentTraits`, `TraitRecord`, `DevelopmentTraitProfile`, `TraitKey`, frequency literals aligned with transition tendencies where applicable
- Extend `ArgumentDevelopmentExtractionResult` with optional `traits` and `traitEvidence` draft shapes
- Extend `ArgumentDevelopmentSignature` / domain voice profile with optional `traitProfile`
- PostgreSQL persistence (JSON on derived profile — document field path in PR)
- Repository read/write on voice profile rebuild round-trip
- Extend `VoiceReasoningPresentationView` and SDK decode with `traitProfile` for dashboard consumption
- Domain mappers: presentation view includes trait records suitable for mirror (no raw LLM evidence blobs in API)

Enum literals per ADR 0008:

- `openingMode`: `observation` | `thesis` | `mixed`
- `perspectiveShiftDensity`, `selfQuestioning`: `low` | `moderate` | `high`
- `usesCounterexamples`, `usesAnalogies`: `rare` | `occasional` | `common` | `dominant`
- `insightTiming`: `early` | `moderate` | `late`
- `closingMode`: `conclusion` | `open_question` | `mixed`
- `TraitRecord.status`: `inferred` | `confirmed` | `disputed` | `unknown`
- `TraitRecord.confidence`: `low` | `medium` | `high`

## Acceptance criteria

- [ ] Migration or schema version documents optional `traitProfile` on profile JSON.
- [ ] Integration test: persist and reload full `traitProfile` round-trip.
- [ ] Voice profile screen API returns `traitProfile` when present; omits gracefully when absent.
- [ ] Contracts use glossary terms from `CONTEXT.md` (**Development Traits**, **Trait Confidence**, **Trait Evidence**).
- [ ] No extraction or dashboard UI changes in this slice (data layer only).
- [ ] Backward compatible: profiles without `traitProfile` decode and serve unchanged.

## Blocked by

- [74-argument-development-contracts-persistence.md](./74-argument-development-contracts-persistence.md) (Argument Development Signature contracts shipped)
