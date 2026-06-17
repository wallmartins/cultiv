# Development Traits — implementation plan

**Status:** draft · **ADR:** [0008](../../adr/0008-development-traits-and-author-confidence.md) · **PRD:** [development-traits-and-author-confidence.md](../prd/development-traits-and-author-confidence.md) · **Extends:** [ADR 0007](../../adr/0007-argument-development-signature.md)

## Goal

Give authors **direct, evidence-backed answers** to eight development questions, with **per-trait confidence**, without a parallel LLM pipeline or editable trait forms.

## Epics (proposed issues 82–86)

| Epic | Scope | Depends on |
|------|-------|------------|
| **82 — Contracts & persistence** | `DevelopmentTraits`, `TraitRecord`, `DevelopmentTraitProfile`; extend extraction result; migration marker if JSON shape versioned | ADR 0008 |
| **83 — Extraction & confidence pass** | Prompt schema; `trait-confidence-pass.ts`; wire into rebuild after parallel extraction | 82, ADR 0007 rebuild |
| **84 — Divergence & reconciliation** | Trait-aware divergence rules; reconciliation prompt includes traits | 83 |
| **85 — Dashboard mirror** | Traits strip, evidence disclosure, immature/unknown copy, Core authority link | 82, voice mappers |
| **86 — Confirmation & regression** | Sim/Não/Não sei API + diagnostics; persona fixtures; `pnpm eval:development-traits` | 85 |
| **87 — Generation pass-through** | Hints/snapshots; compact trait summary in `== ARGUMENT DEVELOPMENT ==` on structural steps | 84, 77, 78 |

## Extraction JSON (target)

```json
{
  "development": {
    "developmentProse": "...",
    "moveLabels": [],
    "transitionTendencies": [],
    "epistemicPosture": "exploratory",
    "structuralAntiPatterns": []
  },
  "traits": {
    "openingMode": "observation",
    "perspectiveShiftDensity": "moderate",
    "usesCounterexamples": "occasional",
    "selfQuestioning": "high",
    "insightTiming": "late",
    "usesAnalogies": "rare",
    "closingMode": "open_question"
  },
  "traitEvidence": {
    "openingMode": ["ex-1", "ex-3"],
    "closingMode": ["ex-2"]
  }
}
```

Post-processing fills `records[*].confidence` and `status` per ADR 0008 rules.

## Trait confidence pass (deterministic)

Inputs: active examples, draft traits, draft traitEvidence, transition tendencies.

Outputs: `DevelopmentTraitProfile` with normalized example ids.

Rules (summary):

- Contradiction across examples → `disputed`, `low`
- 1 / 2 / 3+ supporting examples → `low` / `medium` / `high`
- No signal → `unknown` (omit or null value in mirror)
- Immature profile (&lt;3 examples) → cap at `medium`

## Dashboard (wireframe reference)

See ADR 0008 — traits strip under development hero; evidence in detail layer; one confirmation card per visit.

## Regression

Extend `tests/fixtures/reasoning-regression/` personas with `expectedTraits` + `traitBadCandidates` (optional drift v2).

Script: `pnpm eval:development-traits` — fails if any persona trait confidence rule violated or unknown where expected value exists.

## Flag & cost

- Flag: `voice.reasoningSignatureV1` (unchanged)
- LLM: **0** extra calls vs ADR 0007
- CPU: one deterministic pass per rebuild

## Out of scope (v1)

- Author editing trait enums manually
- Trait-driven generation without `developmentProse`
- Separate feature flag
- User-visible reconciliation conflict UI

## Test plan

- [ ] Golden extraction corpora return valid traits schema
- [ ] Confidence pass: 1/2/3 example thresholds
- [ ] Disputed trait triggers divergence when paired with conflicting Core
- [ ] Mirror renders unknown trait without inventing label
- [ ] Confirmation updates diagnostics only; generation uses reconciled profile
- [ ] `eval:development-traits` green on CI
