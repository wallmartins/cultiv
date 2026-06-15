---
title: Client SDK Client Integration Surface Issue Set
doc_type: issue-set
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Client SDK Client Integration Surface Issue Set

Local issue breakdown derived from:

- `docs/archive/prd/client-sdk-client-integration-surface.md`
- `docs/archive/designs/client-sdk-design.md`

Execution guardrails for all slices:

- follow the `software-engineering` skill guidelines
- follow the `effect-ts` skill guidelines anywhere Effect is used
- when finishing an implementation, follow the `reviewing-code` and `review-delivery` skill guidelines
- preserve single responsibility across modules and files
- prefer deep modules with small, stable interfaces
- avoid oversized files by extracting cohesive modules early
- test external behavior, not implementation details

Issues are ordered so blockers come first.

Current progress:

- issues 01-10 implemented: product SDK surface, contracts, governance, and legacy route removal
