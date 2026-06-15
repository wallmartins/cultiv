---
title: Execution History and Detail
doc_type: issue
status: in-review
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Execution History and Detail

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §7–8

## User stories covered

22, 23, 24, 20

## What to build

Ship **Execution History** list and **Execution History Detail** as the durable archive for past runs, distinct from the quick **Active Execution Drawer**.

This vertical slice proves end-to-end that:

- `/app/history` lists paginated executions via `executions.list`
- client-side filters: period, status, content type (until API filters exist)
- row click opens `/app/history/$executionId`
- detail shows **Execution Result View**: content, status bar, voice confidence metadata, expandable details
- copy and regenerate actions work; regenerate navigates to `/app/generate` with restored state when available
- drawer link "Ver completo" routes to same detail page
- empty and error states match screen spec
- minimal `/app/generate/$executionId` route exists for sync/ops validation (not primary End User async path)

## Acceptance criteria

- [ ] History table loads and paginates.
- [ ] Filters narrow visible rows correctly.
- [ ] Detail page renders completed and failed executions.
- [ ] Regenerate prefills generate screen where briefing data exists.
- [ ] Drawer secondary link opens history detail.

## Blocked by

- [30-execution-observation-and-drawer.md](./30-execution-observation-and-drawer.md)
