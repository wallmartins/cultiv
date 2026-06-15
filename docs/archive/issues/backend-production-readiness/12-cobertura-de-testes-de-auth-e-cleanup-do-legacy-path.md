---
title: Cobertura de Testes de Auth e Cleanup do Legacy Path
doc_type: issue
status: ready-for-agent
domain: backend-production
last_updated: 2026-05-28
---

# Cobertura de Testes de Auth e Cleanup do Legacy Path

## Parent

- `docs/archive/prd/backend-production-readiness.md`
- `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md`

## What to build

Provide isolated and integrated test coverage for the authentication layer, and remove the legacy header-spoofing path from production code. This closes the verification gap identified in the review of Issue 2.

This slice should prove end-to-end behavior that:

- JWT verification outcomes are deterministic and testable without real Auth0 infrastructure
- missing, expired, malformed, wrong-issuer, wrong-audience, and invalid-signature tokens all fail with distinct, observable errors
- JWKS caching behaves as expected
- no production route depends on `x-backend-user-id` or config fallback for identity

Implementation expectations for this slice:

- add unit tests for `public-auth.ts`: valid token, expired token, invalid issuer, invalid audience, invalid signature, unsupported algorithm, malformed JWT, missing token, JWKS fetch failure, JWKS cache hit/miss
- add integration tests for public routes (`POST /api/run`, `POST /api/pipelines`): missing token = 401, invalid token = 401, valid token + JIT provisioning = 200, valid token + suspended user = 403
- add integration tests for operational routes: operator without permission = 403, operator with permission = 200
- remove `resolveBackendAuthenticatedActor` from `legacy-auth.ts` from all production route paths; migrate it to `auth/test-auth.ts` or a dedicated test-only module if test helpers still need it
- ensure `.env.example` includes all auth-related variables required for local test execution
- update `backendRequiredEnvVars` or test configuration so that auth tests can run without production secrets

## Acceptance criteria

- [ ] Unit tests exist for `public-auth.ts` covering all distinct failure reasons.
- [ ] Integration tests exist for at least two public routes with auth outcomes.
- [ ] Integration tests exist for at least one operational route with operator permission checks.
- [ ] No production route handler imports `resolveBackendAuthenticatedActor` from the legacy path.
- [ ] Legacy auth resolver, if still needed for tests, lives in a test-only module.
- [ ] Local test execution passes without requiring production Auth0 credentials.

## Blocked by

- `docs/archive/issues/backend-production-readiness/09-application-user-repository-and-jit-provisioning.md`
- `docs/archive/issues/backend-production-readiness/10-bloqueio-por-estado-suspenso-na-rota-publica.md`
- `docs/archive/issues/backend-production-readiness/11-operator-identity-e-operational-surface-separation.md`
