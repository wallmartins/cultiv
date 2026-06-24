---
title: Frontend Component Test Foundation
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# Frontend Component Test Foundation

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)

## What to build

Add **RTL component tests** for gaps identified in code review (target ≥8 test cases total):

| Area | Focus |
|------|-------|
| Auth gate | `RequireAuth` redirects unauthenticated |
| SDK gate | `AppSdkGate` error state renders i18n message |
| Modal | `AppModal` focus trap + Escape (depends on 93) |
| History hook | `useExecutionsList` `hasMore` with filters (depends on 91) |
| AppSelect | keyboard navigation (optional if time) |

Place tests in `tests/web/` following existing patterns (`voice-rebuild-status-banner.test.tsx`).

## Acceptance criteria

- [ ] ≥8 new test cases across ≥3 files.
- [ ] Tests run in `pnpm test:web`.
- [ ] No snapshot-only tests; assert behavior/DOM roles.
- [ ] CI web job green.

## Blocked by

- [92-auth-flow-i18n-and-document-lang.md](./92-auth-flow-i18n-and-document-lang.md)
- [93-accessible-modal-primitive.md](./93-accessible-modal-primitive.md)
