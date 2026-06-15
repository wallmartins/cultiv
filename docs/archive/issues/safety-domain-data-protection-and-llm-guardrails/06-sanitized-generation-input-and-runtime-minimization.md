---
title: Sanitized Generation Input And Runtime Minimization
doc_type: issue
status: completed
domain: safety-and-compliance
last_updated: 2026-06-02
---

# Sanitized Generation Input And Runtime Minimization

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the slice that wires **Sanitized Generation Input** into the shared
runtime so generation steps consume only the minimal approved user-derived
payload, imported context remains policy-bounded, and the runtime never falls
back to raw request objects or over-broad state.

This slice should prove the end-to-end behavior that:

- policy-approved input is the only user-derived material that crosses from
  request handling into runtime execution
- generation quality remains viable while data minimization is enforced
- the runtime preserves the voice architecture where **Derived Voice Profile**
  remains the generation-time source of truth
- imported context and briefing content are both reduced to the minimal allowed
  envelope before prompt assembly or step execution

Implementation scope:

- replace any raw request or loosely structured input handoff with the typed
  **Sanitized Generation Input** envelope
- ensure prompt assembly and step execution receive only approved fields instead
  of whole request objects
- keep raw **Voice Example** material out of the default generation path and
  preserve **Derived Voice Profile** as the only normal voice source
- apply minimization consistently across preview-confirmed execution reuse so one
  path does not become more permissive than the other
- validate that imported context enters the runtime only when it passed the
  restricted imported-context policy

## User stories covered

- 14, 15, 19, 31, 35, 36, 37, 47

## Acceptance criteria

- [x] The shared runtime consumes only typed **Sanitized Generation Input** and no longer depends on raw request payloads for generation-relevant user content.
- [x] Prompt assembly and step execution receive only the minimal approved fields needed for the declared pipeline behavior.
- [x] The default generation path preserves **Derived Voice Profile** as the voice source of truth and does not expand raw **Voice Example** access.
- [x] Imported context reaches the runtime only through the restricted, policy-approved path defined by earlier slices.
- [x] Integration tests prove parity between preview-driven execution and direct generation execution for minimized input behavior.

## Blocked by

- `02-public-input-safety-gateway-for-generation-boundaries.md`
- `04-restricted-imported-context-ingestion-and-sanitization.md`
- `05-step-scope-contracts-and-handoff-validation.md`
