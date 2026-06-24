---
title: App Route Lazy Loading
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# App Route Lazy Loading

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)

## What to build

Apply **`React.lazy` + `Suspense`** to heavy **authenticated workspace** route entries:

- `/app/generate`
- `/app/voice`
- `/app/history` (+ detail)
- `/app/plans`

Use existing `AppSkeleton` or screen-level skeleton as fallback. Marketing lazy patterns (`ViewportBelowFoldSections`) are prior art.

Measure: initial `/app` chunk should not eagerly import all screen modules.

## Acceptance criteria

- [ ] At least 4 app routes lazy-loaded via route files.
- [ ] Suspense fallback shows skeleton, not blank screen.
- [ ] `pnpm --filter @my-ai-orchestrator/web build` succeeds.
- [ ] No hydration warnings on dev smoke.

## Blocked by

None — can start immediately.
