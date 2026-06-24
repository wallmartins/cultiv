---
title: Database Repository User Scoping
doc_type: issue
status: ready-for-agent
domain: packages
slice_type: AFK
last_updated: 2026-06-24
---

# Database Repository User Scoping

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)

## What to build

Fix **in-memory database package** repositories where API lies about behavior:

- `listByUser` / `countByUser` in job repository must filter by `userId`
- Add tests proving user A cannot see user B jobs via `listByUser`

Align **dependency governance**: either add `@my-ai-orchestrator/skills` to `text-quality/package.json` or update `dependency-governance.test.ts` to match actual dependency graph (pick one correct direction).

## Acceptance criteria

- [ ] `listByUser(userId)` returns only that user's jobs.
- [ ] `countByUser(userId)` counts only that user's jobs.
- [ ] `tests/database/database-jobs.test.ts` extended or new test file.
- [ ] `dependency-governance.test.ts` aligned with package.json (no false expectation).
- [ ] Governance test passes.

## Blocked by

None — can start immediately.
