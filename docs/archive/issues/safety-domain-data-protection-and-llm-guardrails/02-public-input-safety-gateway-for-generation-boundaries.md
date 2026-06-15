---
title: Public Input Safety Gateway For Generation Boundaries
doc_type: issue
status: ready-for-agent
domain: safety-and-compliance
last_updated: 2026-06-01
---

# Public Input Safety Gateway For Generation Boundaries

## Parent

- `docs/archive/prd/safety-domain-data-protection-and-llm-guardrails.md`

## What to build

Build the first production-facing slice of the **Input Safety Gateway** so all
user-derived input entering preview or generation on the **Public API Surface**
is classified, sanitized, validated, and turned into **Sanitized Generation
Input** before any generation path or persistence boundary can continue.

This slice should prove the end-to-end behavior that:

- raw frontend payloads are never trusted as authoritative, even when the client
  performed validation already
- the public product surface returns explicit, non-exploitable outcomes for
  approved, sanitized, quarantined, and blocked input
- route handlers do not reimplement safety rules because the gateway becomes the
  first backend-controlled boundary
- safety approval becomes a prerequisite for preview and execution entry points

Implementation scope:

- integrate the gateway into the public generation entry points that accept
  briefing-like user input, including preview and confirmed generation flows
- classify incoming fields according to the canonical taxonomy, sanitize allowed
  text, and produce a typed **Sanitized Generation Input** envelope
- model policy decisions with typed outcomes instead of booleans so later slices
  can distinguish approve, sanitize, quarantine, and block
- ensure route-surface responses are explicit enough for product UX while not
  leaking policy internals, hidden prompts, or detector reasoning that would
  help adversarial iteration
- fail closed when classification, sanitization, or decision evaluation cannot
  complete

## User stories covered

- 1, 3, 5, 16, 31, 37, 47, 55

## Acceptance criteria

- [ ] Preview and generation public routes both require successful **Input Safety Gateway** approval before generation logic or persistence proceeds.
- [ ] The gateway returns typed decisions that distinguish approved, sanitized, quarantined, and blocked input instead of collapsing them into one generic failure path.
- [ ] Approved requests cross the runtime boundary only as **Sanitized Generation Input**, never as raw user payloads.
- [ ] Route-surface tests prove that bypassing frontend validation does not bypass backend safety enforcement.
- [ ] Gateway failures fail closed and surface explicit user-facing policy failures without exposing internal prompts, hidden rules, or detector internals.

## Blocked by

- `01-safety-policy-foundation-and-boot-validation.md`
