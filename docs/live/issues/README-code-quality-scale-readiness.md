# Code Quality and Scale Readiness — Issues

19 vertical slices (issues **88–106**) + **2 issues de escala/governança (107–108)** para o programa de melhorias pós code review 2026-06-24.

**PRD:** [`code-quality-scale-readiness.md`](../prd/code-quality-scale-readiness.md)  
**Plano:** [`code-quality-scale-readiness-implementation-plan.md`](../plan/code-quality-scale-readiness-implementation-plan.md)  
**Parent:** [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)

## Dependency Graph

```
Phase A (backend reliability)
  88 Postgres errors ──→ 89 Billing reload
  90 JIT subscription (parallel)

Phase B (workspace UX)
  91 History filters ──→ 102 useSdkQuery
  92 Auth i18n
  93 Modal primitive ──┐
  92 ──────────────────┼──→ 103 Component tests

Phase C–G (parallel tracks)
  94 Generation split | 95 Auth0 HITL | 96 Concurrency | 97 DB scoping
  98 AI factory | 101 Lazy routes | 104 Webhook tests | 105 Voice types HITL

Phase F (backend DX)
  88 ──→ 99 Route helper ──→ 100 Cleanup ──→ 106 Legacy /api/run

Phase H (scale + governance)
  89 ──→ 107 Billing API boot lazy-load
  94 ──→ 108 Web file-size governance
```

## Issues

| # | Title | Type | Blocked By | File |
|---|-------|------|------------|------|
| 88 | Postgres Repository Error Propagation | AFK | — | [88](88-postgres-repository-error-propagation.md) |
| 89 | Billing Worker Targeted Reload | AFK | 88 | [89](89-billing-worker-targeted-reload.md) |
| 90 | JIT Free Subscription at Provisioning Only | AFK | — | [90](90-jit-free-subscription-provisioning-only.md) |
| 91 | Execution History Server-Side Filters | AFK | — | [91](91-execution-history-server-side-filters.md) |
| 92 | Auth Flow i18n and Document Lang | AFK | — | [92](92-auth-flow-i18n-and-document-lang.md) |
| 93 | Accessible Modal Primitive | AFK | — | [93](93-accessible-modal-primitive.md) |
| 94 | Generation Screen Modularization | AFK | — | [94](94-generation-screen-modularization.md) |
| 95 | Auth0 Session Cache Security | HITL | — | [95](95-auth0-session-cache-security.md) |
| 96 | Text Quality Lane Concurrency Cap | AFK | — | [96](96-text-quality-lane-concurrency-cap.md) |
| 97 | Database Repository User Scoping | AFK | — | [97](97-database-repository-user-scoping.md) |
| 98 | AI Provider Adapter Factory | AFK | — | [98](98-ai-provider-adapter-factory.md) |
| 99 | Backend Public Route Handler Consolidation | AFK | 88 | [99](99-backend-public-route-handler-consolidation.md) |
| 100 | Backend Route Surface Cleanup | AFK | 99 | [100](100-backend-route-surface-cleanup.md) |
| 101 | App Route Lazy Loading | AFK | — | [101](101-app-route-lazy-loading.md) |
| 102 | SDK Data Fetching Layer | AFK | 91 | [102](102-sdk-data-fetching-layer.md) |
| 103 | Frontend Component Test Foundation | AFK | 92, 93 | [103](103-frontend-component-test-foundation.md) |
| 104 | Webhook Verification Test Suite | AFK | — | [104](104-webhook-verification-test-suite.md) |
| 105 | Voice Profile Type Consolidation | HITL | — | [105](105-voice-profile-type-consolidation.md) |
| 106 | Legacy API Run Deprecation | AFK | 100 | [106](106-legacy-api-run-deprecation.md) |
| 107 | Billing API Boot Lazy Load | AFK | 89 | [107](107-billing-api-boot-lazy-load.md) |
| 108 | Web File Size Governance | AFK | 94 | [108](108-web-file-size-governance.md) |

## Execution Order

**Sprint 1:** 88, 90, 91, 92  
**Sprint 2:** 89, 93, 96, 97  
**Sprint 3:** 94, 98, 99, 101, 102  
**Sprint 4:** 100, 103, 104, 106  
**Sprint 5 (escala):** 107, 108  
**HITL (quando disponível):** 95, 105
