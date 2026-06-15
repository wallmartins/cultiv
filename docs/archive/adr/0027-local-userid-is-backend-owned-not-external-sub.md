---
status: accepted
date: 2026-05-28
deciders: backend-production-readiness team
---

# Local `userId` is the Backend-Owned `ApplicationUser.id`, Not the External Auth0 `sub`

## Context

Public routes authenticate via Auth0 JWT bearer tokens. The token carries an OIDC `sub` claim that identifies the external identity subject. The backend must resolve a canonical, backend-owned user record from this external subject so that:

- resource ownership is stable even if the external identity provider changes
- local state (status, billing, audit) can be enforced server-side
- support and audit can correlate requests to a durable local identity

The original Issue 2 (Auth0 JWT and Application User resolution) assumed that `userId` downstream would remain the raw Auth0 `sub`. The corrective slices (Issues 09–12) introduced a local `ApplicationUser` entity and changed the downstream `userId` to the backend-owned UUID.

## Decision

Downstream code—route handlers, execution pipelines, billing, audit, and SDK contracts—receives `userId` as the local `ApplicationUser.id` (a backend-generated UUID), never the raw external `sub`.

The mapping from external `sub` → local `userId` happens exactly once per authentication, inside `resolveBackendPublicAuthenticatedActor`, via the `ApplicationUserService` layer.

## Consequences

### Positive

- **Stable ownership**: changing identity providers or re-issuing Auth0 subjects does not break existing resources.
- **Local enforcement**: `status`, billing entitlements, and audit trails reference a record the backend controls.
- **Idempotency**: repeated requests with the same `sub` resolve to the same local `id` via `findByExternalSubject`.
- **Testability**: tests can create local users directly without fabricating Auth0 tokens.

### Negative

- **Correlation cost**: support operators must join `ApplicationUser.externalSubject` to correlate a local `userId` back to an Auth0 subject.
- **Migration complexity**: any existing data that used raw `sub` as `userId` must be migrated to local UUIDs.

## Implementation

- `resolveBackendPublicAuthenticatedActor` provisions a new `ApplicationUser` when `findByExternalSubject` returns `None`.
- The resolved actor carries `userId: localUser.id`.
- `toAuthenticatedPipelineRequest` injects this `userId` into the pipeline request.
- `BackendUserSuspendedError` uses the local `userId` so that error responses do not leak external subjects.

## Related

- `docs/archive/adr/0011-application-user-as-local-ownership-root.md`
- `docs/archive/adr/0013-jit-user-provisioning-and-explicit-operator-grants.md`
- `docs/archive/adr/0015-bearer-token-only-public-api-v1.md`
- `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md`
- `docs/archive/issues/backend-production-readiness/09-application-user-repository-and-jit-provisioning.md`
