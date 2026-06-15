---
title: App i18n Governance and QA Gate
doc_type: issue
status: in-review
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# App i18n Governance and QA Gate

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)

## User stories covered

4, 21, 31, 32, 33, 34

## What to build

Complete **App Locale** coverage, SDK error mapping, automated tests, and release QA so the **Authenticated Workspace** program meets PRD acceptance criteria.

This vertical slice proves end-to-end that:

- all `app.*` namespaces have pt/en parity (shell, generate, voice, history, onboarding, settings, errors, notifications, qualityModes)
- `ApiErrorCode` maps to user-facing copy via `i18n/errors.ts`
- unit tests cover preview debounce, composer single-vs-batch routing, error mapper
- integration tests run SDK services against mocked transport
- governance test passes for `apps/web`
- responsive QA checklist completed for all `/app/*` routes
- optional E2E: login → generate → watch → drawer (Auth0 test tenant or mocked token)

## Acceptance criteria

- [ ] No missing i18n keys in pt/en for app namespaces (CI or script check).
- [ ] Safety and auth errors show localized messages in UI.
- [ ] `tests/governance/frontend-client-boundary.test.ts` passes.
- [ ] Documented manual QA checklist signed off for mobile and desktop.
- [ ] PRD acceptance criteria verified against implemented routes.

## Blocked by

- [30-execution-observation-and-drawer.md](./30-execution-observation-and-drawer.md)
- [31-execution-history-and-detail.md](./31-execution-history-and-detail.md)
- [33-onboarding-and-account-settings.md](./33-onboarding-and-account-settings.md)
