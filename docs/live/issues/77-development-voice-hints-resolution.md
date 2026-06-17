---
title: Development Voice Hints and Resolution
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Development Voice Hints and Resolution

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

8, 9

## What to build

Ensure reconciled **Argument Development Signature** flows intact from profile storage through **resolveEffectiveVoice** and voice hints into execution — mirroring the Core reasoning pass-through invariant.

Deliver:

- `buildVoiceHints` includes `argumentDevelopmentSignature` when flag on and profile has development data
- `mergeVoiceProfile` (and related merge paths) preserve development fields — regression for the class of bug that stripped Core reasoning from hints
- `resolveEffectiveVoice` delivers full development payload to pipeline
- Voice profile snapshots record development version/signals applied
- Feature flag off: no development in hints; no behavior change vs ADR 0006-only path

## Acceptance criteria

- [ ] Partial voice hints merge does not strip `argumentDevelopmentSignature`.
- [ ] Integration test: rebuild → resolveEffectiveVoice → execution context contains development fields.
- [ ] Snapshot metadata includes development when present.
- [ ] Flag off: hints identical to pre-issue behavior.
- [ ] Unit test mirrors Core reasoning merge regression pattern for development fields.

## Blocked by

- [74-argument-development-contracts-persistence.md](./74-argument-development-contracts-persistence.md)
- [76-voice-signature-divergence-reconciliation.md](./76-voice-signature-divergence-reconciliation.md)
