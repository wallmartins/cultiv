---
title: Lexical Regression Corpus and Metrics
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Lexical Regression Corpus and Metrics

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

7, 10

## What to build

- `tests/fixtures/lexical-regression/` — **≥30 briefings**, distributed across **all six** content types (minimum 5 each):
  - `linkedin-post`, `twitter-thread`, `newsletter`: mostly `non-technical` briefings
  - `architecture-post`, `validation-post`: `technical` briefings
  - `long-form-blog`: mix of technical and non-technical
  - Include ≥5 `mixed` domain cases across types
- Each fixture: `briefing`, `contentType`, `expectedDomain`, `language`, optional `qualityMode`
- Eval script: `pnpm eval:lexical` (or `tests/backend/lexical-regression.test.ts`) computing metrics from plan §7
- Record **baseline** in tracker before issues 19–24 merge; **post** after issue 24

Optional: CI job on changed `text-quality` / execution paths (can be nightly if too slow).

## Acceptance criteria

- [ ] Corpus committed with documented schema.
- [ ] Eval produces metric table (stdout or markdown report).
- [ ] Tracker baseline row filled after first eval run.
- [ ] Domain classifier tests use subset of same fixtures for consistency.

## Blocked by

- `17-unified-output-word-target.md` (can scaffold earlier; full eval needs 23–24)
