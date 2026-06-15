---
title: Docs And Contract Parity For Routing Profiles And Activation
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# Docs And Contract Parity For Routing Profiles And Activation

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that aligns live docs and internal operational contract
references with the new **Routing Profile** model, native Gemini and DeepSeek
support, and **Active AI Policy Pointer** activation semantics.

This slice should prove the end-to-end behavior that:

- live docs describe **Routing Profile** and policy activation consistently
- internal operational semantics are documented clearly enough for future
  contributors and operators
- public-facing docs continue to keep provider routing hidden from end users

## Acceptance criteria

- [ ] Live docs describe **Routing Profile**, provider activation, and policy-version safety semantics consistently with the implemented backend behavior.
- [ ] Internal contract references clearly distinguish public generation semantics from internal operational activation semantics.
- [ ] Documentation reflects Gemini and DeepSeek as native providers in the runtime model without exposing provider choice to end users.

## Blocked by

- `05-fallback-execution-inside-routing-profile.md`
- `09-internal-policy-activation-api-and-audit-trail.md`
- `10-policy-activation-safety-through-preview-and-quote-semantics.md`
