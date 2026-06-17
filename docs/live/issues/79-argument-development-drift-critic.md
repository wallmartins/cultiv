---
title: Argument Development Drift and Critic
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Argument Development Drift and Critic

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

3, 5, 7, 10

## What to build

Extend **text-quality** with heuristic **Argument Development Drift** aligned to reconciled **Argument Development Signature**. Run in **every Quality Mode** including `fast` — not only when **Voice Judge** runs.

Deliver:

- `evaluateArgumentDevelopmentDrift`: penalties for epistemic posture mismatch, move misalignment, transition tendency violations, structural anti-pattern hits, premature thesis position
- `critic.ts` extensions for structural findings (distinct from Core **Derived Anti-Patterns** / reasoning critic findings)
- Integrate into `lane-runner` alongside **Reasoning Drift**; expose scores in candidate trace
- Adjust scorer weights to include development drift in candidate ranking
- Extend regression fixtures with ≥3 development personas for CI
- Feature flag gates new penalties when off

## Acceptance criteria

- [ ] Exploratory author + advocacy-arc candidate scores lower on development drift.
- [ ] Premature thesis in first third triggers structural finding when author moves include doubt/experimentation.
- [ ] Structural anti-pattern match reduces development drift score.
- [ ] Development drift runs in `fast`, `balanced`, and `strict` modes (unit/integration proof).
- [ ] Flag off: no development drift impact on selection.
- [ ] Candidate trace includes development drift notes for observability.

## Blocked by

- [77-development-voice-hints-resolution.md](./77-development-voice-hints-resolution.md)
