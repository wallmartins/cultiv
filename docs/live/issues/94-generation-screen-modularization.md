---
title: Generation Screen Modularization
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# Generation Screen Modularization

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Architecture Deepening Fase 4 (partial prior split)
- Governance: 400-line budget

## What to build

Decompose **`GenerationScreen`** (~515 lines) into focused sub-screens or presentation components without changing generation behavior:

- Wizard steps vs legacy flow vs preview sidebar already partially extracted — complete the split
- Target: main screen file ≤ **400 lines** (file-size governance if extended to web, or local budget)
- Extract orchestration hooks where they reduce inline effect chains

No new product features; refactor only.

## Acceptance criteria

- [ ] `GenerationScreen.tsx` ≤ 400 lines.
- [ ] Intent wizard, legacy flow, commercial gate, and submit paths still work.
- [ ] Existing `generation-wizard-logic` and preview tests pass.
- [ ] No new `any` types.

## Blocked by

None — can start immediately.
