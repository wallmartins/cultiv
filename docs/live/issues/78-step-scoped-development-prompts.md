---
title: Step-Scoped Development Prompts
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Step-Scoped Development Prompts

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

1, 3, 5

## What to build

Extend **Step-Scoped Reasoning Injection** with a separate `== ARGUMENT DEVELOPMENT ==` prompt block parallel to `== AUTHOR REASONING ==`.

Deliver:

- `buildArgumentDevelopmentBlock` (or equivalent) formatting development prose, moves, transitions by step depth
- Structural LLM steps (`hook`, `outline`, `structure`, `draft`, `expand`): full development content
- Refinement steps (`refine`, `tighten`): epistemic posture + structural anti-patterns only
- Core and Development blocks both present when flag on; blocks remain separate (no merged author paragraph)
- Feature flag `voice.reasoningSignatureV1` gates injection; no-op when off

## Acceptance criteria

- [ ] Prompt snapshots: structural step includes full development prose and moves.
- [ ] Prompt snapshots: refinement step includes posture + structural anti-patterns only (no full development prose).
- [ ] `== AUTHOR REASONING ==` and `== ARGUMENT DEVELOPMENT ==` both appear when flag on.
- [ ] Flag off: no `== ARGUMENT DEVELOPMENT ==` section in prompts.
- [ ] No regression to existing reasoning injection behavior from issue 69.

## Blocked by

- [77-development-voice-hints-resolution.md](./77-development-voice-hints-resolution.md)
