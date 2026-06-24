---
title: Code Quality and Scale Readiness
doc_type: prd
status: ready-for-agent
domain: platform
last_updated: 2026-06-24
---

# Code Quality and Scale Readiness — PRD

## Summary

Address structural and operational gaps identified in the **2026-06-24 full-stack code review** so Cultiv can scale users, executions, and billing volume without silent failures, UX regressions, or mounting maintenance cost.

**Governance:** [plan](../plan/code-quality-scale-readiness-implementation-plan.md) · [parent issue](./issue-code-quality-scale-readiness.md) · [issues 88–108](../issues/README-code-quality-scale-readiness.md)

## Problem

The monorepo has strong foundations — contract-first APIs, Effect-TS services, safety architecture, client-sdk boundary — but several patterns that work at early scale will break observability, performance, or user trust as load grows:

| Area | Symptom | Risk |
|------|---------|------|
| Backend Postgres repos | DB errors become empty lists / not-found | Incidents masked in production |
| Worker billing reload | Full billing snapshot reload per job | O(all billing data) per execution |
| Auth middleware | `ensureDefaultFreeSubscription` on every request | Unnecessary writes on read paths |
| Execution history | Client-side filters after server pagination | Empty lists, broken "load more" |
| Frontend data layer | Manual `useEffect` fetch hooks everywhere | Duplication; no shared cache (ADR drift vs TanStack Query) |
| Auth UX | PT-only auth strings; fixed `lang="pt-BR"` | Broken bilingual workspace |
| Modals | No focus trap / `aria-labelledby` | Accessibility gaps |
| Packages | Unbounded text-quality concurrency; `listByUser` ignores userId | Cost spikes; test lies |
| Security | Auth0 tokens in `localStorage` | XSS token exfiltration surface |

## Goals

1. **Observable failures** — infrastructure errors surface as tagged errors and correct HTTP status, not silent empty data.
2. **Scalable billing path** — worker and API read only the billing state needed per operation.
3. **Correct history UX** — filters and pagination behave consistently end-to-end.
4. **Bilingual workspace** — auth and shell respect **App Locale** including `document.lang`.
5. **Accessible interactions** — shared modal primitive with keyboard and screen-reader support.
6. **Controlled LLM cost** — bounded concurrency in text-quality lanes.
7. **Maintainable codebase** — reduce route boilerplate, provider duplication, and god-components.
8. **Test confidence** — component and webhook coverage for gaps called out in review.

## Non-goals

- New product features (voice judge, development traits, compositor) — tracked elsewhere.
- Multi-region active-active deployment.
- Replacing Effect-TS or Hono.
- Full migration of every screen to TanStack Query in one release (phased via SDK fetching layer).
- Cassandra or alternate primary database.

## Users and stakeholders

| Actor | Need |
|-------|------|
| End user | History filters work; app locale applies everywhere; modals are usable with keyboard |
| Operator | DB outages visible in logs and metrics, not as false empty states |
| Engineering | Less boilerplate; packages behave as documented |
| Finance | Billing reads scale with executions, not global table scans |

## User stories

1. As an **end user**, I want execution history filters to return consistent results, so that I can find past runs without empty pages.
2. As an **end user** using English **App Locale**, I want auth and loading copy in English, so that the experience feels coherent.
3. As an **end user** using a screen reader, I want modals to trap focus and announce their purpose, so that I can complete consent and destructive actions safely.
4. As an **operator**, I want database connection failures to return 5xx with structured errors, so that I can detect incidents quickly.
5. As an **operator**, I want workers to debit credits without reloading all subscriptions, so that execution throughput scales.
6. As a **developer**, I want a shared SDK fetch hook, so that I do not copy cancelled-flag boilerplate in every screen.
7. As a **developer**, I want AI provider adapters generated from one factory, so that adding a provider is one diff.
8. As **finance**, I want credit reservation to read current subscription state efficiently, so that high job volume does not degrade workers.

## Implementation decisions

### Backend reliability

- Introduce a **`DatabaseError`** (or reuse existing infra tagged error) propagated from Postgres repositories instead of `catchAll → empty`.
- Keep **not-found** as an explicit branch when `executeTakeFirst` returns undefined — distinct from query failure.
- Replace **full `reloadBillingRepositoryInto`** in worker with **targeted reload** for the execution's `userId` (subscription + wallet slice), or read-through at capture time.
- Move **`ensureDefaultFreeSubscription`** to JIT provisioning (`resolveBackendPublicAuthenticatedActor` on create path only), not every `resolvePublicActor` call.

### Execution history (vertical slice)

- Extend **`GET /me/executions`** query contract: `period`, `status`, `contentType` (optional).
- Apply filters in SQL/Kysely; return `total` matching filters.
- Update **client-sdk** `executions.list` and **useExecutionsList** to pass filters; remove client-side filter pass; fix `hasMore`.

### Frontend platform

- **`useSdkQuery`** (minimal) or TanStack Query wrapper: status enum, retry, cancellation, keyed cache — migrate hooks incrementally starting with history and content types.
- **`AppModal`** primitive: focus trap, Escape, `aria-labelledby`, initial focus, restore focus on close.
- **`document.documentElement.lang`** synced from **App Locale** in workspace shell.
- Auth/callback/**AppSdkGate** strings through existing `messages` catalogs.

### Security (HITL)

- ADR or decision record for **Auth0 `cacheLocation`**: evaluate `memory` vs `localstorage` given billing + voice data; document tradeoff and implement chosen default.

### Packages

- Cap **text-quality** lane `Effect.forEach` concurrency (configurable, default e.g. 3).
- Fix **`database` `listByUser` / `countByUser`** to filter by `userId`.
- **AI provider factory** for OpenAI-compatible adapters.
- **Voice profile type consolidation** (HITL): single canonical contract type with explicit mappers in domain and text-quality — governance test updated.

### Developer experience

- **`createPublicRoute`** helper: auth → decode → handler → encode response.
- Remove duplicate **`GET /api/internal/policies`** handler; align **Routes** enum usage in voice routes.
- Remove **`dist.bak.*`** from backend tree; add to `.gitignore` if needed.
- Align **dependency-governance** test with `text-quality/package.json` (add `skills` dep or update test).

### Deprecation

- Audit client-sdk and web for **`POST /api/run`** usage; deprecate then remove legacy route when unused.

### Scale (phase H)

- **API boot lazy-load** for billing repository — no full-table scan on process start (issue 107).
- **Web file-size governance** — extend 400-line CI budget to `apps/web` (issue 108).

## Testing decisions

- **Behavior over implementation** — assert HTTP status, response shape, and UI-visible outcomes.
- Postgres repo tests: simulate `tryPromise` failure → expect `DatabaseError`, not `[]`.
- Billing worker: integration test proving targeted reload does not load unrelated users' ledger.
- History: backend filter integration + frontend hook test for `hasMore` with filters.
- Modal: RTL test for focus trap and Escape (pattern: `voice-rebuild-status-banner.test.tsx`).
- Webhooks: signature rejection and idempotent replay tests.
- Prior art: `tests/backend/durable-runtime.integration.test.ts`, `tests/governance/*`, `tests/web/app-i18n-parity.test.ts`.

## Out of scope

- Billing repository lazy-load at API boot (future scale phase — document in plan as Phase H).
- E2E Playwright suite (separate initiative).
- CSP headers (infra runbook).

## Success metrics

| Metric | Target |
|--------|--------|
| Postgres repo masked failures | 0 catch-all-to-empty on query errors |
| Worker billing reload | No full-table reload per job |
| History filter bug | Repro test passes; QA checklist green |
| Auth strings i18n | `app-i18n-parity` covers auth keys |
| Text-quality concurrency | Configurable cap; default ≤ 3 |
| `GenerationScreen` | ≤ 400 lines or split across routed steps |
| New component tests | ≥ 8 cases across auth, modal, history hook |

## Further notes

- Complements **Architecture Deepening** program (file-size governance) — several issues reduce god-modules and duplication.
- Does not block current product tracks (development traits 82–87, compositor, deploy).
