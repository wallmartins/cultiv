---
title: Reasoning Contracts and Persistence
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Reasoning Contracts and Persistence

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

7, 8

## What to build

Introduce durable types and storage for **Core Reasoning Signature**, **Format Expression Profile**, and **Derived Anti-Patterns**, versioned with the existing **Derived Voice Profile**.

Deliver end-to-end:

- Domain and contract types for hybrid reasoning representation (narrative prose + enums)
- PostgreSQL migration (JSON columns or normalized child records — pick one approach and document in PR)
- Repository read/write on voice profile rebuild
- Extended `VoiceProfileScreenView` (and SDK decode) exposing reasoning fields for the dashboard
- Execution metadata hooks if needed to trace reasoning version used (align with existing voice snapshot pattern)

Enums v1: `certaintyLevel`, `judgmentFrequency`, `conclusionPace`, `readerRelationship`, `authoritySource`.

Format expression v1: `register`, `openingStyle`, `technicalDensity`, short `narrativeProse` per content type.

## Acceptance criteria

- [ ] Migration applies cleanly; rollback path documented.
- [ ] Rebuild can persist and reload a full reasoning payload round-trip in integration test.
- [ ] `GET` voice profile screen returns reasoning fields when present; omits gracefully when absent (pre-migration profiles).
- [ ] Contracts and domain types use glossary terms from `CONTEXT.md`.
- [ ] No reasoning fields consumed by generation yet (data layer only).

## Blocked by

None — can start immediately.
