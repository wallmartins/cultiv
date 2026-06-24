---
title: Voice Profile Type Consolidation
doc_type: issue
status: ready-for-agent
domain: packages
slice_type: HITL
last_updated: 2026-06-24
---

# Voice Profile Type Consolidation

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Governance: `voice-profile-centralization-governance.test.ts`
- CONTEXT.md: Voice Profile, Derived Voice Profile

## What to build

**HITL:** Reduce **three parallel Voice Profile representations** to one canonical contract type with explicit mappers:

| Layer | Today | Target |
|-------|-------|--------|
| contracts | `VoiceProfileView`, schemas | **Canonical** |
| domain | `DerivedVoiceProfile` | mapper from contract |
| text-quality | `VoiceProfile` | mapper from contract |

Steps:

1. Decision: which fields are canonical vs derived-only
2. Update governance test to enforce single schema source
3. Mappers in domain and text-quality; no duplicate field lists
4. All voice/reasoning tests green

Do not change persisted DB shape without migration issue.

## Acceptance criteria

- [ ] ADR or plan decision section documents canonical type.
- [ ] `text-quality` and `domain` import/map from contracts — no parallel struct definitions.
- [ ] `voice-profile-centralization-governance.test.ts` updated and passing.
- [ ] No regression in voice rebuild or generation tests.

## Blocked by

None — can start immediately (HITL decision gates schema choices).
