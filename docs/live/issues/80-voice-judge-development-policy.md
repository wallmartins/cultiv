---
title: Voice Judge Development Policy
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Voice Judge Development Policy

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

4, 5

## What to build

Update **Voice Judge** policy and prompt to reinforce **Argument Development Signature** without replacing heuristic development drift.

Deliver:

- `voice-judge-policy.ts`: `balanced` triggers when reasoning drift borderline (60–80) **OR** development drift borderline (60–80) **OR** top-two `finalScore` within 2 points
- `strict`: always judge top two (unchanged frequency); prompt enriched with Development
- `fast`: judge never runs (unchanged)
- Judge prompt includes reconciled **Core Reasoning Signature**, **Argument Development Signature**, and 1–2 author examples
- Observability: log trigger reason (`reasoning_borderline`, `development_borderline`, `tie`, `strict`)
- Groq preferred via **Voice Judge Routing Profile**; existing fallbacks unchanged

## Acceptance criteria

- [ ] Policy unit tests: development borderline alone triggers judge in `balanced`.
- [ ] Policy unit tests: clear winner with good development drift does not trigger judge in `balanced`.
- [ ] `strict` always attempts judge on top two when flag on.
- [ ] `fast` never invokes judge.
- [ ] Mock judge receives both Core and Development blocks in prompt.
- [ ] Trigger reason logged for observability (no example body in logs).

## Blocked by

- [79-argument-development-drift-critic.md](./79-argument-development-drift-critic.md)
- [71-voice-judge-groq.md](./71-voice-judge-groq.md)
