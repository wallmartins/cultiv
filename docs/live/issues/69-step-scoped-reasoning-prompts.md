---
title: Step-Scoped Reasoning Injection in Prompts
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Step-Scoped Reasoning Injection in Prompts

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

1, 2

## What to build

Implement **Step-Scoped Reasoning Injection** in generation prompts.

Deliver:

- New `== AUTHOR REASONING ==` block in system template with core prose, format expression, enums, and derived anti-patterns
- Depth by step:
  - Structural (`hook`, `outline`, `structure`, `draft`, `expand`): full reasoning narrative + format expression
  - Refinement (`refine`, `tighten`): enum guardrails + anti-patterns only
- Wire resolved reasoning from execution voice context into skill template variables
- Voice examples remain step-scoped as today (do not regress issue 21 behavior)
- Feature flag `voice.reasoningSignatureV1`: when off, block omitted

## Acceptance criteria

- [ ] Prompt snapshots for LinkedIn `hook` and `draft` show full reasoning block when flag on.
- [ ] `refine` snapshot shows guardrail enums only (no full core prose).
- [ ] All six catalog content types receive format expression when profile exists for that type.
- [ ] System prompt tests prove preset cognitive strings no longer appear in reasoning section.
- [ ] Generation runs end-to-end with flag on using fixture author (smoke test).

## Blocked by

- [68-format-only-presets-voice-resolution.md](./68-format-only-presets-voice-resolution.md)
