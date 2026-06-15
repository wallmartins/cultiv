---
title: AI Policy Generation Preview Issue Set
doc_type: issue-set
status: in-progress
domain: ai-implementation
last_updated: 2026-05-24
---

# AI Policy Generation Preview Issue Set

Local issue breakdown derived from:

- `docs/archive/prd/ai-policy-generation-preview.md`

Execution guardrails for all slices:

- follow the `software-engineering` skill guidelines
- follow the `effect-ts` skill guidelines anywhere Effect is used
- preserve single responsibility across modules and files
- prefer deep modules with small, stable interfaces
- avoid oversized files by extracting cohesive modules early
- test external behavior, not implementation details

Issues are ordered so blockers come first.

Current progress:

- slices `01` to `13` are implemented

Implementation coordination:

- [IMPLEMENTATION-COORDINATION.md](./IMPLEMENTATION-COORDINATION.md)
