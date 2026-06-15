---
title: Unified OutputWordTarget
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Unified OutputWordTarget

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)
- ADR: [`0001-generation-domain-and-lexical-quality.md`](../../adr/0001-generation-domain-and-lexical-quality.md)

## User stories covered

6, 8

## What to build

Create a **single canonical module** for output word targets consumed by:

- `apps/backend/src/execution/skill-templates.ts` (`resolveWordTarget` / `resolveFormatInstructions`)
- `packages/text-quality/src/format/output-length.ts` (`resolveOutputWordTarget`, `describeOutputWordTarget`)
- Critic and `selectBestCandidate` (via existing imports)

Remove duplicated hardcoded ranges. LinkedIn must be **130–220 words, ideal ~170** everywhere.

## Acceptance criteria

- [ ] One exported `resolveOutputWordTarget` (or shared package re-export) is the only source of numeric ranges.
- [ ] `skill-templates.ts` calls the canonical function for prompt text.
- [ ] `tests/backend/linkedin-word-target.test.ts` passes.
- [ ] `tests/text-quality/text-quality-package.test.ts` updated — LinkedIn selector no longer prefers ~930-word candidates.
- [ ] No other files duplicate min/max/ideal word counts for content types in the catalog.

## Blocked by

—
