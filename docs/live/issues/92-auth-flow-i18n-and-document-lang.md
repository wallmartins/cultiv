---
title: Auth Flow i18n and Document Lang
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# Auth Flow i18n and Document Lang

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Decisions: App Locale bilíngue em `/app/*`

## What to build

Internationalize all **auth-adjacent** copy through existing `messages` catalogs (PT + EN):

- `RequireAuth`, `AppSdkGate`, `AuthLoading`, `callback.tsx`, `login.tsx`
- `NotificationHost` dismiss label

Sync **`document.documentElement.lang`** with **App Locale** in workspace shell (`/app/*`), not only marketing `MarketingLayout`. Root `__root.tsx` should not hardcode `lang="pt-BR"` for authenticated routes or delegate lang to locale provider.

Extend `app-i18n-parity` test for new auth keys.

## Acceptance criteria

- [ ] No hardcoded PT strings in auth components (except test fixtures).
- [ ] EN App Locale shows English auth/callback copy.
- [ ] `document.lang` is `en` or `pt-BR` matching App Locale on workspace routes.
- [ ] `app-i18n-parity` test covers new keys.
- [ ] `pnpm test:web` green.

## Blocked by

None — can start immediately.
