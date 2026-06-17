---
title: Reasoning Regression Corpus and Policy
doc_type: issue
status: ready-for-agent
domain: text-generation
slice_type: HITL
last_updated: 2026-06-16
---

# Reasoning Regression Corpus and Policy

## Parent

- [`author-reasoning-signature.md`](../prd/author-reasoning-signature.md)
- [`issue-author-reasoning-signature.md`](../prd/issue-author-reasoning-signature.md)
- [ADR 0006](../../adr/0006-author-reasoning-signature.md)

## User stories covered

6, 9, 10

## What to build

Close the **Author Reasoning Signature** program with regression assets, baseline metrics, and compliance notes.

Deliver:

- Fixture corpus `tests/fixtures/reasoning-regression/`: ≥6 author personas (including high-confidence 12-example profile), ≥30 briefings across content types
- Eval script (`pnpm eval:reasoning` or extension of existing eval) measuring reasoning drift failures, critic hits, optional judge scores
- Baseline document in plan folder or fixture README (pre-flag metrics)
- Safety/consent note: Groq as subprocessor for **Voice Judge** under **Voice Training Consent** (docs update only)
- Program QA checklist: manual blind review template for "sounds like me"
- Feature flag rollout checklist (alpha/beta/GA from plan)

## Acceptance criteria

- [ ] Eval script runs locally in CI without external Groq key (mocked judge) and optionally with key in manual workflow.
- [ ] Baseline metrics recorded for at least one fixture author before/after flag.
- [ ] Consent/subprocessor documentation updated for Groq judge path.
- [ ] Parent issue acceptance criteria can be signed off using corpus results.
- [ ] HITL: product owner signs blind review sample (≥10 generations) — attach summary in PR or tracker note.

## Blocked by

- [67-reasoning-extraction-rebuild.md](./67-reasoning-extraction-rebuild.md)
- [71-voice-judge-groq.md](./71-voice-judge-groq.md)
