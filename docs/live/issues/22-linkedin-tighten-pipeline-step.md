---
title: Format Condensation Pipeline Steps
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# Format Condensation Pipeline Steps

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

3, 6

## What to build

Introduce a **shared `tighten` skill** (condense to `OutputWordTarget`, remove repeated lemmas, preserve voice and format structure). Wire it per content type in the official policy catalog — not LinkedIn-only.

### `linkedin-post`

```
hook → draft → refine → tighten → sanitize
```

Add `tighten` step (today missing).

### `twitter-thread`

Today the catalog step named `tighten` maps to skill `refine`. Change to:

```
hook → expand → tighten → sanitize
```

where `tighten` uses the real tighten skill (condense + de-repeat for thread rhythm).

### `newsletter` (optional in this issue if scope tight)

```
outline → draft → refine → [tighten if over max] → finalize → sanitize
```

Implement as catalog step or conditional execution when word count exceeds target after refine.

### Long formats (`long-form-blog`, `architecture-post`, `validation-post`)

No new catalog step required. Document that condensation is handled by refine + lexical gate.

**Shared implementation:**

- `createTightenSkillDefinition()` or extend `skill-templates` tighten user instructions from issue 19.
- `classifyStep("tighten")` already returns `transform`.

## Acceptance criteria

- [ ] LinkedIn catalog includes `tighten` before `sanitize`.
- [ ] Twitter `tighten` step uses tighten skill, not refine.
- [ ] Regression corpus (issue 25): > 90% length compliance for **linkedin-post and twitter-thread**.
- [ ] Newsletter: either optional tighten documented or length compliance > 90% without new step (note in tracker).
- [ ] Parity tests updated for affected pipeline step counts.

## Blocked by

- `17-unified-output-word-target.md`
- `19-prompt-policy-domain-prompts.md`
