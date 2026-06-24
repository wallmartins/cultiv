---
title: Accessible Modal Primitive
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# Accessible Modal Primitive

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Workspace UI primitives: issue 40

## What to build

Add **`AppModal`** (or extend existing pattern) in `platform/ui` with:

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (or `aria-label`)
- Focus trap while open; initial focus on primary action or title
- Escape closes; restore focus to trigger on close
- Scroll lock on body (optional, match drawer behavior)

Migrate **Voice Training Consent Modal** and **Delete Footprints Modal** (Settings) to use it. Remove duplicated overlay/button markup.

## Acceptance criteria

- [ ] `AppModal` exported from platform UI.
- [ ] Both modals migrated; visual parity preserved.
- [ ] RTL test: Escape closes; focus returns to trigger.
- [ ] No regression in voice consent flow or settings delete.

## Blocked by

None — can start immediately.
