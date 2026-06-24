---
title: Text Quality Lane Concurrency Cap
doc_type: issue
status: ready-for-agent
domain: generation-quality
slice_type: AFK
last_updated: 2026-06-24
---

# Text Quality Lane Concurrency Cap

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Package: `text-quality`

## What to build

Replace **`concurrency: "unbounded"`** in text-quality pipeline lane execution with a **configurable cap** (default **3**). Expose cap via pipeline request options or quality controls config — not hardcoded magic in one file only.

Preserve quality outcomes; only limit parallel LLM calls per generation request.

## Acceptance criteria

- [ ] Default concurrency cap = 3 (or documented alternative).
- [ ] Test proves N lanes do not all start simultaneously when N > cap (mock/spy acceptable).
- [ ] Existing text-quality tests green.
- [ ] `ponytail:` comment names upgrade path to per-plan caps.

## Blocked by

None — can start immediately.
