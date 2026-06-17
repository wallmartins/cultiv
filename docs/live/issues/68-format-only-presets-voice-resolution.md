---
title: Format-Only Presets and Effective Voice Resolution
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-16
---

# Format-Only Presets and Effective Voice Resolution

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

2, 7

## What to build

Strip cognitive/narrative author rules from **Content Type Format Preset** and wire reasoning into **resolveEffectiveVoice**.

Deliver:

- `voice-presets.ts`: remove generic `rules`, `styleMarkers`, and `antiPatterns` that impose reasoning (e.g. *progress through discovery*); keep format constraints (word targets, paragraph shape, platform conventions)
- `voice-hints.ts`: stop overriding derived `tone`/`cadence` with preset persona; stop merging preset cognitive rules
- `buildVoiceHints` / effective resolution: attach **Core Reasoning Signature** + **Format Expression Profile** for requested content type
- Merge **Derived Anti-Patterns** with user `antiPatternsExplicit`
- Voice profile snapshots record applied reasoning signals
- Governance test: presets must not contain known cognitive narrative rule strings

## Acceptance criteria

- [ ] LinkedIn preset no longer injects discovery-led or similar cognitive rules.
- [ ] Author with formal LinkedIn examples + informal thread examples receives format expression delta without separate cognitive profiles per channel.
- [ ] `resolveEffectiveVoice` output includes reasoning payload consumed downstream (typed contract).
- [ ] Existing voice confidence and example selection behavior preserved.
- [ ] Feature flag off: preset cleanup still applies; reasoning payload omitted when flag off.

## Blocked by

- [66-reasoning-contracts-persistence.md](./66-reasoning-contracts-persistence.md)
- [67-reasoning-extraction-rebuild.md](./67-reasoning-extraction-rebuild.md)
