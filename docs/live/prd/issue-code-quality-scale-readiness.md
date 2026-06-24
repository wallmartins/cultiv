---
title: Code Quality and Scale Readiness
doc_type: issue
status: ready-for-agent
domain: platform
slice_type: HITL
last_updated: 2026-06-24
---

# Code Quality and Scale Readiness

## Parent

- PRD: [`code-quality-scale-readiness.md`](./code-quality-scale-readiness.md)
- Plan: [`../plan/code-quality-scale-readiness-implementation-plan.md`](../plan/code-quality-scale-readiness-implementation-plan.md)
- Origin: full-stack code review (2026-06-24)
- Domain: [`CONTEXT.md`](../../../CONTEXT.md)

## What to build

Deliver the **Code Quality and Scale Readiness** program: fix reliability, scalability, accessibility, and maintainability gaps from the 2026-06-24 review without changing product behavior users rely on.

Tracks:

- Postgres error propagation
- billing worker targeted reload
- JIT subscription provisioning
- execution history filters end-to-end
- auth i18n and document lang
- accessible modal primitive
- generation screen modularization
- Auth0 session cache decision
- text-quality concurrency cap
- packages hygiene
- AI provider factory
- backend route consolidation
- SDK data fetching layer
- app route lazy loading
- frontend component tests
- webhook test coverage
- voice profile type consolidation
- legacy `/api/run` removal
- billing API boot lazy-load
- web file-size governance in CI

**Out of program scope:** new generation features, multi-region, E2E Playwright suite, CSP runbook (infra).

## Child issues

| # | Issue | Type | Blocked by |
|---|-------|------|------------|
| 88 | [Postgres repository error propagation](../issues/88-postgres-repository-error-propagation.md) | AFK | — |
| 89 | [Billing worker targeted reload](../issues/89-billing-worker-targeted-reload.md) | AFK | 88 |
| 90 | [JIT free subscription at provisioning only](../issues/90-jit-free-subscription-provisioning-only.md) | AFK | — |
| 91 | [Execution history server-side filters](../issues/91-execution-history-server-side-filters.md) | AFK | — |
| 92 | [Auth flow i18n and document lang](../issues/92-auth-flow-i18n-and-document-lang.md) | AFK | — |
| 93 | [Accessible modal primitive](../issues/93-accessible-modal-primitive.md) | AFK | — |
| 94 | [Generation screen modularization](../issues/94-generation-screen-modularization.md) | AFK | — |
| 95 | [Auth0 session cache security](../issues/95-auth0-session-cache-security.md) | HITL | — |
| 96 | [Text quality lane concurrency cap](../issues/96-text-quality-lane-concurrency-cap.md) | AFK | — |
| 97 | [Database repository user scoping](../issues/97-database-repository-user-scoping.md) | AFK | — |
| 98 | [AI provider adapter factory](../issues/98-ai-provider-adapter-factory.md) | AFK | — |
| 99 | [Backend public route handler consolidation](../issues/99-backend-public-route-handler-consolidation.md) | AFK | 88 |
| 100 | [Backend route surface cleanup](../issues/100-backend-route-surface-cleanup.md) | AFK | 99 |
| 101 | [App route lazy loading](../issues/101-app-route-lazy-loading.md) | AFK | — |
| 102 | [SDK data fetching layer](../issues/102-sdk-data-fetching-layer.md) | AFK | 91 |
| 103 | [Frontend component test foundation](../issues/103-frontend-component-test-foundation.md) | AFK | 92, 93 |
| 104 | [Webhook verification test suite](../issues/104-webhook-verification-test-suite.md) | AFK | — |
| 105 | [Voice profile type consolidation](../issues/105-voice-profile-type-consolidation.md) | HITL | — |
| 106 | [Legacy api run deprecation](../issues/106-legacy-api-run-deprecation.md) | AFK | 100 |
| 107 | [Billing API boot lazy load](../issues/107-billing-api-boot-lazy-load.md) | AFK | 89 |
| 108 | [Web file size governance](../issues/108-web-file-size-governance.md) | AFK | 94 |

## Acceptance criteria

- [ ] All child issues 88–108 merged with acceptance criteria met.
- [ ] No regression in `pnpm test:ci` and governance tests.
- [ ] `progress-log.md` updated per completed phase.

## Blocked by

None — can start immediately (parallel tracks within phases).
