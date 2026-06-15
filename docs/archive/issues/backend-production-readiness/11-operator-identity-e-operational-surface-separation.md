---
title: Operator Identity e Operational Surface Separation
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Operator Identity e Operational Surface Separation

## Parent

- `docs/archive/prd/backend-production-readiness.md`
- `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md`
- `docs/archive/issues/backend-production-readiness/03-separacao-de-public-e-operational-surfaces.md`

## What to build

Replace the legacy header-based authentication on the operational surface with a dedicated **Operator** identity model. This removes the remaining `x-backend-user-id` spoofing path and keeps operational controls strictly separate from public user access.

This slice should prove end-to-end behavior that:

- the operational surface resolves identity through a dedicated `Operator` model, not through `Application User` headers
- operator access is controlled by backend-owned roles and permissions
- public routes never reach operational controls
- the `Sync Run` and policy activation endpoints remain protected by explicit permission checks

Implementation expectations for this slice:

- define `BackendOperator` with fields: `id`, `permissions`, `roles`, `status`
- introduce `BackendOperatorRepository` interface and in-memory implementation
- create `resolveBackendOperationalActor` that resolves an operator from the request (bearer token or other agreed mechanism)
- replace `resolveBackendAuthenticatedActor` (legacy) usage in `internal-policy-routes.ts` with the new operational resolver
- ensure `requireBackendPermission` and `requireBackendRole` work with both `BackendAuthenticatedActor` and `BackendOperator`, or provide operator-specific variants
- remove or deprecate `legacy-auth.ts` from operational routes; keep it only in test helpers if needed
- record operator identity in audit-ready fields where the operational surface already logs actors

## Acceptance criteria

- [x] `BackendOperator` type exists with `id`, `permissions`, `roles`, `status`.
- [x] `BackendOperatorRepository` interface exists with at least `findById` and `create`.
- [x] In-memory implementation exists and is tested in isolation.
- [x] Operational routes use `resolveBackendOperationalActor` instead of the legacy header-based resolver.
- [x] Operator access without required permission returns HTTP 403.
- [x] Valid operator with required permission can access policy activation and reload endpoints.
- [x] Legacy `x-backend-user-id` fallback is no longer used on any operational route.
- [x] Repository is accessible through `BackendProductServices`.

## Blocked by

- `docs/archive/issues/backend-production-readiness/09-application-user-repository-and-jit-provisioning.md`
