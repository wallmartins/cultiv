---
title: Showcase and Voice Fixtures Audit
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: HITL
last_updated: 2026-06-11
---

# Showcase and Voice Fixtures Audit

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

1, 7

## What to build

After lexical quality program (issues 17–24) ships:

1. Regenerate showcase `voiceOutput` for **all published themes** (minimum: `linkedin-post`, `twitter-thread`; extend to `newsletter` / blog if in catalog) via backend with domain-appropriate briefings (see `04-showcase-generation-guide.md`).
2. Audit fixtures containing default tech jargon (`cache`, thread examples, voice batch items) across formats.
3. Update showcase theme files — no forced tech metaphors on non-technical briefings.
4. Document in generation guide: training examples may be technical; non-tech briefings still produce accessible copy on **any** content type.

## Acceptance criteria

- [ ] Showcase LinkedIn and thread voice samples pass manual review: personal tone, no gratuitous tech jargon on non-tech briefings.
- [ ] `tests/web/showcase-catalog.test.ts` passes.
- [ ] `04-showcase-generation-guide.md` updated with domain rule, per-format notes, and regen steps.
- [ ] No fixture used as default voice example dominates tech lexicon without user intent.

## Blocked by

- `24-lexical-release-gate-selection.md`
