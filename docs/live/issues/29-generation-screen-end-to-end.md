---
title: Generation Screen End-to-End
doc_type: issue
status: in-review
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Generation Screen End-to-End

## Parent

- [`issue-authenticated-workspace-web-v2.md`](../prd/issue-authenticated-workspace-web-v2.md)
- Screen spec: [`web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md) §4

## User stories covered

11, 12, 13, 14, 15, 16, 17, 21, 30

## What to build

Implement the **Generation Screen** (`/app/generate`) as a complete compose-and-submit surface: catalog **Content Types**, dynamic **Briefing Form**, optional **Imported Context Field**, **Quality Mode Presentation**, debounced **Generation Preview**, and **Async Run** creation.

This vertical slice proves end-to-end that:

- `contentTypes.list` populates selector; unavailable types stay visible but disabled with reason
- **Briefing Form** renders `inputSchema` per selected type; briefing submits as structured record
- **BriefingGuidancePanel** shows guidance from catalog
- collapsed **Imported Context Field** accepts paste-only text (≤8k) into `importedContext`
- quality modes show product labels (pt: Direto/Equilibrado/Afinado; en: Light/Balanced/Polished) while API sends `fast`/`balanced`/`strict`
- preview debounces 500ms; shows price, balances, recommendation; stores `quoteId`
- generate button states match spec (incomplete, loading, no credits, blocked safety)
- `executions.create` enqueues async run; user stays on generate screen; new item appears in **Active Execution List** (id + queued status minimum)
- field-label and content-type i18n overlays cover catalog ids
- typed SDK errors surface in preview/generate UI

## Acceptance criteria

- [x] User can select each catalog content type and see correct dynamic fields.
- [x] Preview updates after briefing changes with debounce.
- [x] User can submit generation; execution id appears in active list.
- [x] User remains on `/app/generate` after submit (no forced navigation).
- [x] Quality mode labels match PRD in both locales.
- [x] Imported context expand/collapse works; oversize blocked client-side at 8k.

## Blocked by

- [28-app-shell-and-active-execution-shell.md](./28-app-shell-and-active-execution-shell.md)
