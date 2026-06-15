---
title: Auth0 Jwt E Resolucao De Application User
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Auth0 Jwt E Resolucao De Application User

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Introduce real Auth0-backed authentication for public requests and resolve a
canonical backend-owned **Application User** from the authenticated identity.

This slice should prove end-to-end behavior that:

- valid Auth0 JWTs are accepted and invalid tokens are rejected
- the backend knows which Auth0 issuer, audience, and JWKS endpoint to trust
- auth configuration is validated at bootstrap before requests are served
- the runtime has the dependencies it needs to verify and cache Auth0 public keys
- the backend resolves a typed authenticated actor from the token claims
- the first authenticated public request provisions the local application user
- suspended or otherwise blocked user state is enforced server-side
- public authentication failures map to stable HTTP and domain errors

Implementation expectations for this slice:

- add the runtime and test dependencies needed for JWT verification and JWKS
  resolution
- validate Auth0-related configuration fields explicitly, including the issuer
  URL, audience, JWKS cache behavior, and clock tolerance used to validate
  bearer tokens
- fail boot when production auth config is incomplete, malformed, or points to
  an unsupported issuer/audience combination
- keep the auth bootstrap local to the backend surface so public routes do not
  depend on ad hoc token parsing or legacy header fallback
- map the trusted token claims into the backend actor model in one place
- keep the provisioning path idempotent so repeated authenticated requests do
  not duplicate the application user
- surface missing/invalid auth configuration as boot-time validation errors,
  not runtime surprises
- preserve the boundary between authentication, authorization, and local user
  provisioning
- make the public identity source the bearer token only; any test-only actor
  injection must remain outside the public request path
- preserve a stable mapping from the Auth0 subject claim to the backend-owned
  local user record so support and audit can correlate requests later
- normalize roles and permissions from trusted token claims or backend-owned
  state, not from client-supplied headers

## Acceptance criteria

- [x] Public requests authenticate with Auth0 JWTs instead of local or implied identity.
- [x] Auth0 bootstrap validates issuer, audience, and key resolution settings before serving requests.
- [x] Invalid or missing tokens fail with clear unauthorized responses.
- [x] Expired, malformed, wrong-issuer, and wrong-audience tokens fail with distinct and testable auth outcomes.
- [x] The token-to-actor mapping is implemented in one backend-owned place and is testable in isolation.
- [x] The authentication and identity path is isolated enough to be tested without production infrastructure.
- [x] The backend provisions and resolves an **Application User** on first authenticated access.
- [x] Suspended or deactivated local user state blocks public API access even if the external identity is valid.
- [x] Public API requests do not depend on the legacy `x-backend-user-id` fallback path.

## Remaining work

All acceptance criteria are satisfied. The original gaps were closed through the following corrective slices:

- `09-application-user-repository-and-jit-provisioning.md` — `BackendApplicationUser` entity, repository, and JIT provisioning on first authenticated request.
- `10-bloqueio-por-estado-suspenso-na-rota-publica.md` — `status` field (`active` | `suspended`) and 403 blocking on public routes.
- `11-operator-identity-e-operational-surface-separation.md` — `BackendOperator` identity, operational actor resolution, and removal of `x-backend-user-id` from operational routes.
- `12-cobertura-de-testes-de-auth-e-cleanup-do-legacy-path.md` — unit and integration test coverage for auth, removal of `resolveBackendAuthenticatedActor` from production code.
- `13-alinhamento-de-rastreabilidade-e-documentacao.md` — tracker and issue alignment; ADR documenting local `userId` semantics.

## Blocked by

- `01-config-bootstrap-unificada-para-dev-test-e-prod.md`
