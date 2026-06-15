---
title: Versioned AI Routing Profiles And Provider Activation Issue Set
doc_type: issue-set
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Versioned AI Routing Profiles And Provider Activation Issue Set

Local issue breakdown derived from:

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

Execution guardrails for all slices:

- follow the `software-engineering` skill guidelines
- follow the `effect-ts` skill guidelines anywhere Effect is used
- preserve single responsibility across modules and files
- prefer deep modules with small, stable interfaces
- avoid oversized files by extracting cohesive modules early
- test external behavior, not implementation details

Issues are ordered so blockers come first.

Current progress:

- slices `01` to `12` are ready for implementation
