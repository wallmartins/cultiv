---
title: PromptPolicy and Domain-Aware Prompts
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: AFK
last_updated: 2026-06-11
---

# PromptPolicy and Domain-Aware Prompts

## Parent

- [`text-generation-lexical-quality.md`](../prd/text-generation-lexical-quality.md)
- [`issue-text-generation-lexical-quality.md`](../prd/issue-text-generation-lexical-quality.md)

## User stories covered

1, 2, 3

## What to build

Add `prompt-domain-policy.ts` and wire `GenerationContext.domain` into `skill-templates.ts`:

**`non-technical` policy:**
- Forbid technical jargon, tool/product names, and software metaphors unless quoted from briefing.
- Metaphors must match briefing domain (career, learning, relationships, etc.).

**`technical` policy:**
- Allow domain-appropriate terminology; still instruct against gratuitous repetition.

**`mixed` policy:**
- Technical terms only where briefing requires; accessible language elsewhere.

**Template changes:**
- Replace lexicon section: “use sparingly; max once per term unless essential” (not “weave in naturally”).
- Add `{{domainPolicy}}` and `{{generationDomain}}` to system template.
- **refine:** “vary vocabulary; do not repeat hook opening verbatim”.
- **tighten:** “condense to word target; remove repeated lemmas”.

## Acceptance criteria

- [ ] `resolvePromptPolicy(domain)` returns localized policy text (pt/en via existing language resolution).
- [ ] Golden snapshot tests: 3 domains × 3 steps (hook, draft, refine) — policy block present and correct.
- [ ] `resolveOutputRules` includes explicit domain rule aligned with PRD product rule.

## Blocked by

- `18-generation-domain-classifier.md`
