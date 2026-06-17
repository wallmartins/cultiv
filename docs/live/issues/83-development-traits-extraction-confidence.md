---
title: Development Traits Extraction and Confidence Pass
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Development Traits Extraction and Confidence Pass

## Parent

- [`development-traits-and-author-confidence.md`](../prd/development-traits-and-author-confidence.md)
- [`issue-development-traits.md`](../prd/issue-development-traits.md)
- [ADR 0008](../../adr/0008-development-traits-and-author-confidence.md)

## User stories covered

1, 3, 5, 8

## What to build

Extend **Argument Development Extraction** to infer **Development Traits** and proposed **Trait Evidence** in the **same LLM request** as ADR 0007, then run a deterministic **Trait Confidence Pass** before persistence.

Deliver end-to-end:

- Update extraction system/user prompts and schema decode for `traits` + `traitEvidence`
- Extraction still blind to draft **Core Reasoning Signature** (no anchoring)
- New deterministic module (e.g. `trait-confidence-pass.ts`): normalize evidence ids, apply confidence/status rules from ADR 0008, cap confidence at `medium` when development immature (&lt;3 active examples)
- Wire into **Voice Profile Rebuild** after parallel development extraction succeeds, before divergence check
- Persist resulting `DevelopmentTraitProfile` on **Derived Voice Profile** via issue 82 types
- Test transport fixtures return valid traits JSON for rebuild integration tests
- Observability: `trait_confidence_computed` with counts by confidence/status

`unknown` traits must not invent enum values — omit value or mark `status: unknown` per contract rules.

## Acceptance criteria

- [ ] Rebuild with ≥3 active examples persists `traitProfile` with ≥5 trait records on golden fixtures.
- [ ] Confidence pass unit tests: 1 / 2 / 3+ example thresholds; contradiction → `disputed`; immature cap at `medium`.
- [ ] Invalid evidence ids stripped; only active example ids retained.
- [ ] Zero additional LLM calls vs pre-issue-83 rebuild (same extraction purpose/metadata).
- [ ] Extraction failure keeps last valid `traitProfile` on profile.
- [ ] Golden extraction corpora (≥3 personas) with expected traits in `tests/fixtures/`.

## Blocked by

- [82-development-traits-contracts-persistence.md](./82-development-traits-contracts-persistence.md)
- [75-parallel-argument-development-extraction.md](./75-parallel-argument-development-extraction.md)
