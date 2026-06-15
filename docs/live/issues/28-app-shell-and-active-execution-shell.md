---
title: App Shell and Active Execution Shell
doc_type: issue
status: done
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# App Shell and Active Execution Shell

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)

## User stories covered

17, 18 (shell only), 30

## What to build

Ship the **Authenticated Workspace** chrome: **App Shell** layout, primary navigation, header **CreditDisplay**, and an **Active Execution List** shell (empty state ready for watch data).

This vertical slice proves end-to-end that:

- `/app` redirects to `/app/generate`
- `AppLayout` wraps all `/app/*` routes with sidebar (desktop) and bottom nav (mobile)
- three primary nav items: Generate, History, Voice — Settings only from avatar menu
- **CreditDisplay** shows balance from cached minimal **Generation Preview** (`['creditBalance']` query)
- **Active Execution List** region exists in sidebar (desktop) and behind header badge/drawer (mobile)
- list empty state copy is localized (**App Locale**)
- placeholder route content on generate/history/voice proves layout on all breakpoints

## Acceptance criteria

- [x] Logged-in user sees App Shell on `/app/generate`, `/app/history`, `/app/voice`.
- [x] Mobile bottom nav shows three items; avatar opens path to settings.
- [x] Header shows credit balance or skeleton while preview balance loads.
- [x] Active execution area renders empty state without errors.
- [x] `/app` redirects to `/app/generate`.

## Blocked by

- [27-auth-and-sdk-foundation.md](./27-auth-and-sdk-foundation.md)
