---
title: Voice Dashboard and Example Composer
doc_type: issue
status: in-review
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Voice Dashboard and Example Composer

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §9–12

## User stories covered

5, 6, 10, 25, 26

## What to build

Deliver **Voice Dashboard**, examples list, and shared **Voice Example Composer** with single-create vs batch routing and **Voice Training Consent** gate.

This vertical slice proves end-to-end that:

- `/app/voice` shows **Voice Confidence**, diagnostics summary, format coverage, CTAs
- `/app/voice/examples` lists paginated examples
- `/app/voice/examples/new` and edit routes use shared **Voice Example Composer**
- one slot submit → `voice.createExample`; two or more → batch flow (`createBatch` → `addBatchItems` → `commitBatch`)
- edit mode locks to one slot + `voice.updateExample`
- consent modal blocks first persist until accepted
- batch partial failures show per-slot results
- **ReminderBanner** on generate links here when voice step skipped (integration hook only; full onboarding in issue 33)

## Acceptance criteria

- [ ] Dashboard renders profile and diagnostics from `voice.getProfile`.
- [ ] User can create one example via single path.
- [ ] User can create multiple examples in one submit via batch path.
- [ ] User can edit an existing example.
- [ ] Consent modal appears before first save.
- [ ] Examples list paginates and refreshes after mutations.

## Blocked by

- [28-app-shell-and-active-execution-shell.md](./28-app-shell-and-active-execution-shell.md)
