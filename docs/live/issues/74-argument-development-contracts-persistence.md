---
title: Argument Development Contracts and Persistence
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-17
---

# Argument Development Contracts and Persistence

## Parent

- [`argument-development-signature.md`](../prd/argument-development-signature.md)
- [`issue-argument-development-signature.md`](../prd/issue-argument-development-signature.md)
- [ADR 0007](../../adr/0007-argument-development-signature.md)

## User stories covered

2, 7, 8

## What to build

Introduce durable types and storage for **Argument Development Signature**, versioned with the existing **Derived Voice Profile** alongside **Core Reasoning Signature**.

Deliver end-to-end:

- Domain and contract types for **Argument Development Signature Representation**: `developmentProse`, `moveLabels`, `transitionTendencies`, `epistemicPosture`, `structuralAntiPatterns`
- Types for reconciliation metadata (`VoiceSignatureReconciliationResult` or equivalent)
- PostgreSQL persistence (JSON on derived profile or child record — document choice in PR)
- Repository read/write on voice profile rebuild
- Extended `VoiceProfileScreenView` (and SDK decode) exposing development fields for dashboard
- `immature` signal when active examples &lt; 3 (aligned with **Voice Confidence**)

`epistemicPosture` v1 literals: `exploratory`, `investigative`, `advocacy_mixed`.

## Acceptance criteria

- [ ] Migration applies cleanly; rollback path documented.
- [ ] Rebuild can persist and reload a full development payload round-trip in integration test.
- [ ] `GET` voice profile screen returns development fields when present; omits gracefully when absent.
- [ ] Contracts use glossary terms from `CONTEXT.md`.
- [ ] No development fields consumed by generation yet (data layer only).
- [ ] `immature: true` when &lt;3 active examples; field present in API contract.

## Blocked by

- [66-reasoning-contracts-persistence.md](./66-reasoning-contracts-persistence.md) (Author Reasoning Signature contracts shipped)
