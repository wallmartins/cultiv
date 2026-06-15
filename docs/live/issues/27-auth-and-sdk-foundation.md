---
title: Auth and SDK Foundation
doc_type: issue
status: done
domain: authenticated-workspace
slice_type: HITL
last_updated: 2026-06-12
---

# Auth and SDK Foundation

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)
- PRD: [`cultiv-authenticated-workspace-web-v2.md`](../prd/cultiv-authenticated-workspace-web-v2.md)

## User stories covered

1, 2, 3, 30, 31

## What to build

Establish Auth0 authentication and **Client Integration Surface** wiring so protected `/app/*` routes resolve a signed-in **End User** and can call the **Public API Surface** through `client-sdk`.

This vertical slice proves end-to-end that:

- Auth0 Universal Login works (SPA + API audience matching backend JWKS)
- `/callback` completes the session; `/login` shortcut works
- `/app/*` routes reject unauthenticated visitors and redirect to Auth0
- `createClientSdk` receives `getToken` from Auth0 `getAccessTokenSilently`
- Effect layers (`auth-layer`, `sdk-layer`) expose the SDK to the app runtime
- smart post-login redirect runs: no examples + incomplete onboarding → `/app/onboarding`; otherwise → `/app/generate`
- a smoke test (or dev route) proves an authenticated SDK call succeeds (e.g. content types or voice profile)
- governance: `client-sdk` declared in `apps/web`; no direct backend HTTP in source

v2 onboarding flag uses `localStorage` (`cultiv.onboarding.completed`) until backend exposes **Onboarding Completion**.

## Acceptance criteria

- [ ] Auth0 tenant configured with correct callback, logout URLs, and API audience. *(HITL — code + `.env.example` ready)*
- [x] Unauthenticated visit to `/app/generate` redirects to login.
- [x] Successful login lands on onboarding or generate per redirect rules.
- [x] Authenticated SDK request returns decoded data without transport errors. *(unit test + `/app/generate` smoke UI)*
- [x] `tests/governance/frontend-client-boundary.test.ts` still passes (no new violations).

## Implementation notes

- Auth: `apps/web/src/lib/auth/*`, `apps/web/src/components/app/*`
- SDK runtime: `apps/web/src/lib/runtime/*`, smoke service `content-types-smoke.ts`
- Routes: `/login`, `/callback`, `/app/generate`, `/app/onboarding`
- Run tests: `pnpm test:web` from repo root

## Blocked by

None — can start immediately (requires Auth0 tenant credentials — HITL for tenant setup).
