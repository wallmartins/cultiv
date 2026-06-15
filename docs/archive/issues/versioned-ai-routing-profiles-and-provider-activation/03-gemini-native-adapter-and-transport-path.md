---
title: Gemini Native Adapter And Transport Path
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Gemini Native Adapter And Transport Path

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that adds Gemini as a native provider-specific integration in
the shared adapter and transport boundary so the backend can execute Gemini
attempts through the same runtime path used by existing providers.

This slice should prove the end-to-end behavior that:

- Gemini has provider-specific request construction and response normalization
- Gemini transport uses typed configuration and transport failures
- Gemini can participate in the shared runtime without route-level branching

## Acceptance criteria

- [ ] Gemini is registered as a native provider in the adapter service with provider-specific request and response handling.
- [ ] Backend transport can execute Gemini requests with typed configuration and typed transport failures.
- [ ] Gemini provider behavior is covered by adapter-level and backend-facing tests that assert external contract behavior.

## Blocked by

- `01-routing-profile-schema-and-boot-validation.md`
