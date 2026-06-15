---
title: Bloqueio por Estado Suspenso na Rota Pública
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Bloqueio por Estado Suspenso na Rota Pública

## Parent

- `docs/archive/prd/backend-production-readiness.md`
- `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md`

## What to build

Enforce that a suspended or deactivated **Application User** blocks public API access even when the external identity token is valid. This completes the server-side ownership boundary started in the JIT provisioning slice.

This slice should prove end-to-end behavior that:

- an active application user can access public routes normally
- a suspended application user receives a clear 403 response on any public route
- the suspension check happens after identity resolution and before authorization or business logic
- the error shape is stable enough for a future TypeScript SDK to handle predictably

Implementation expectations for this slice:

- add `status: "active" | "suspended"` to `BackendApplicationUser`
- after `resolveBackendPublicAuthenticatedActor` resolves the local user (via repository), check `status`
- if `status === "suspended"`, fail with a typed error (extend `BackendAuthorizationError` or introduce `BackendUserSuspendedError`) mapped to HTTP 403
- update `error-response.ts` to map the new error to 403 with a clear message
- ensure the check is consistent across all public routes that use the public auth resolver
- keep the suspension check inside the auth module so route handlers do not need to remember it

## Acceptance criteria

- [x] `BackendApplicationUser` includes `status` with allowed values `"active"` and `"suspended"`.
- [x] Valid JWT + suspended local user = HTTP 403 with clear error response.
- [x] Valid JWT + active local user = request proceeds normally.
- [x] Suspension check is implemented inside the public auth resolver, not duplicated in route handlers.
- [x] Error response shape is stable and includes a machine-readable reason code.
- [x] Tests cover active and suspended scenarios for at least one public route.

## Blocked by

- `docs/archive/issues/backend-production-readiness/09-application-user-repository-and-jit-provisioning.md`
