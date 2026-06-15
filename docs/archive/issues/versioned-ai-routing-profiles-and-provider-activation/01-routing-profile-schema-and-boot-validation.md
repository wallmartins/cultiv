---
title: Routing Profile Schema And Boot Validation
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Routing Profile Schema And Boot Validation

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the first vertical slice of the new **Routing Profile** model so the
backend can load a versioned AI policy where `fallbackProfile` is no longer the
central routing concept and invalid routing policy fails at boot with typed
errors.

This slice should prove the end-to-end behavior that:

- **Routing Profile** is a canonical AI policy concept with preferred attempts,
  fallback attempts, and operational constraints
- the official policy loader can validate routing-profile definitions and step
  references coherently
- invalid routing policy blocks backend startup before preview or execution can
  run

## Acceptance criteria

- [ ] The official AI policy schema supports **Routing Profile** definitions with provider/model attempts and operational constraints.
- [ ] LLM steps can reference **Routing Profile** definitions and invalid references fail at boot with typed validation errors.
- [ ] `fallbackProfile` is no longer required as the central routing concept for the active policy model.

## Blocked by

None - can start immediately.
