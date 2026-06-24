---
title: Execution History Server-Side Filters
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-24
---

# Execution History Server-Side Filters

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §7
- Fixes bug in issue 31 client-side filter approach

## What to build

End-to-end **Execution History** filtering: extend `GET /me/executions` contract with optional query params `period` (7d|30d|90d|all), `status`, `contentType`. Apply filters in Postgres/Kysely; `total` reflects filtered count.

Update **client-sdk** `executions.list`, backend route, and **`useExecutionsList`**: pass filters to API; remove client-side filter pass; fix `hasMore` to use filtered pagination semantics.

## Acceptance criteria

- [ ] Contract schema + decoder for list query params.
- [ ] API returns filtered `items` and matching `total`.
- [ ] Frontend filters trigger API refetch (not local filter on fetched page).
- [ ] `hasMore` correct when filters reduce result set.
- [ ] Tests: backend list filters + frontend hook test for pagination edge case.
- [ ] `app-i18n` unchanged (filters already localized).

## Blocked by

None — can start immediately.
