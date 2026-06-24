---
title: Backend Route Surface Cleanup
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Backend Route Surface Cleanup

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)

## What to build

Low-risk backend hygiene:

1. Remove duplicate handler: **`GET /api/internal/policies`** vs **`/active`** — keep one canonical route, deprecate the other in comment if external consumers exist
2. Use **`Routes` enum** consistently in `voice-routes.ts` (replace hardcoded `"GET /me/voice-profile"` strings)
3. Delete **`apps/backend/dist.bak.*`** directories; add pattern to `.gitignore` if backups reappear
4. Remove extra **`getJobStatus`** round-trip after enqueue if response can return created job directly (optional if trivial)

## Acceptance criteria

- [ ] Single internal policies list route (or documented alias with shared implementation).
- [ ] Voice routes use `Routes.*` for observability strings.
- [ ] No `dist.bak.*` in repo tree.
- [ ] Integration tests green.

## Blocked by

- [99-backend-public-route-handler-consolidation.md](./99-backend-public-route-handler-consolidation.md)
