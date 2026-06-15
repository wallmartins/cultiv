---
title: Application User Repository e JIT Provisioning
 doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Application User Repository e JIT Provisioning

## Parent

- `docs/archive/prd/backend-production-readiness.md`
- `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md`

## What to build

Create the **Application User** domain entity, a repository interface with an in-memory implementation, and integrate JIT provisioning into the public authentication path so that the first authenticated request creates a backend-owned user record.

This slice should prove end-to-end behavior that:

- the backend owns a local user identity separate from the external Auth0 subject
- the repository can find a user by external subject and create one idempotently
- the public authentication resolver provisions the local user automatically on first valid JWT access
- the `userId` exposed to downstream routes is the backend-owned local identifier, not the raw Auth0 `sub`
- the correlation between the local user and the external subject is preserved for audit and support

Implementation expectations for this slice:

- define `BackendApplicationUser` with fields: `id`, `externalSubject`, `status`, `createdAt`, `updatedAt`
- introduce `BackendApplicationUserRepository` interface with `findByExternalSubject`, `create`, `findById`
- provide an in-memory implementation that can later be replaced by a PostgreSQL-backed one in Issue 4
- modify `resolveBackendPublicAuthenticatedActor` to resolve or create the application user after JWT verification succeeds
- ensure the returned `BackendAuthenticatedActor.userId` is the local `id`, while the external subject is retained inside the repository
- keep the provisioning path idempotent: repeated requests with the same `sub` must not duplicate the local record
- wire the repository into `BackendProductServices` so route handlers and downstream modules can access it
- do not yet enforce suspension checks; that belongs to the next slice

## Acceptance criteria

- [x] `BackendApplicationUser` type exists with stable fields.
- [x] `BackendApplicationUserRepository` interface exists with `findByExternalSubject`, `create`, `findById`.
- [x] In-memory implementation passes isolated unit tests for create, find, and idempotency.
- [x] Public auth resolver provisions a local application user on the first authenticated request.
- [x] Repeated authenticated requests with the same JWT `sub` reuse the same local `id`.
- [x] Downstream route handlers receive the local `userId`, not the raw Auth0 `sub`.
- [x] Repository is accessible through `BackendProductServices`.

## Blocked by

None - can start immediately.
