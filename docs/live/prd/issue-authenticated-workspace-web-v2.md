---
title: Authenticated Workspace Web v2
doc_type: issue
status: ready-for-agent
domain: authenticated-workspace
slice_type: AFK
last_updated: 2026-06-12
---

# Authenticated Workspace (Web v2)

## Parent

- PRD: [`cultiv-authenticated-workspace-web-v2.md`](./cultiv-authenticated-workspace-web-v2.md)
- Plan: [`../plan/phase-2-implementation-plan.md`](../plan/phase-2-implementation-plan.md)
- Structure: [`../plan/web-v2-platform-structure.md`](../plan/web-v2-platform-structure.md)
- Screen specs: [`../plan/web-v2-screen-specs.md`](../plan/web-v2-screen-specs.md)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## User stories covered

1–34 (full PRD)

## What to build

Deliver the Cultiv **Authenticated Workspace** under `/app/*`: Auth0 sign-in, **Client Integration Surface** consumption, async-first **Generation Screen**, **Active Execution List** with drawer and **Completion Notification**, **Execution History**, **Voice Dashboard** and **Voice Example Composer**, two-step **Onboarding**, and **Account Settings** — bilingual (**App Locale** pt-BR and en) from day one.

This program proves end-to-end that an **End User** can:

- authenticate and reach the correct first screen (onboarding vs generate)
- teach voice with the shared composer (single or batch ingestion)
- generate text with dynamic briefing, preview, and product-friendly quality mode labels
- start **Async Run** and continue using the app while generations complete
- read results from the active list drawer or history detail
- manage voice examples and review **Voice Confidence**
- change app locale and sign out

**Out of program scope:** **Billing Surface**, marketing redesign, file upload for **Imported Context**, **Sync Run** as default End User path, mobile app.

## Child issues

| # | Issue | Milestone |
|---|-------|-----------|
| 27 | [Auth and SDK foundation](../issues/27-auth-and-sdk-foundation.md) | M1 |
| 28 | [App shell and active execution shell](../issues/28-app-shell-and-active-execution-shell.md) | M2 |
| 29 | [Generation screen end-to-end](../issues/29-generation-screen-end-to-end.md) | M3 |
| 30 | [Execution observation and drawer](../issues/30-execution-observation-and-drawer.md) | M4a |
| 31 | [Execution history and detail](../issues/31-execution-history-and-detail.md) | M4b |
| 32 | [Voice dashboard and example composer](../issues/32-voice-dashboard-and-example-composer.md) | M5 |
| 33 | [Onboarding and account settings](../issues/33-onboarding-and-account-settings.md) | M6 |
| 34 | [App i18n governance and QA gate](../issues/34-app-i18n-governance-and-qa-gate.md) | M7 |

**Suggested order:** 27 → 28 → 29 → (30 ∥ 32 in part) → 31 → 33 → 34

## Acceptance criteria (program)

- [ ] All child issues acceptance criteria satisfied.
- [ ] PRD acceptance criteria in `cultiv-authenticated-workspace-web-v2.md` satisfied.
- [ ] `tests/governance/frontend-client-boundary.test.ts` passes for `apps/web`.
- [ ] No `/app/billing` routes shipped in this program.

## Blocked by

None for issue 27 — marketing surface and backend **Public API Surface** are prerequisites (assumed available).
