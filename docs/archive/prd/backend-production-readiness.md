---
title: PRD - Backend Production Readiness
doc_type: prd
status: active
domain: backend-production
last_updated: 2026-05-28
---

# PRD: Backend Production Readiness

## Problem Statement

The backend is structurally sound for development, but it is not yet safe to
expose to real users or production traffic. The current system still depends on
in-memory persistence in critical paths, does not yet have real OIDC-backed
identity, mixes product and operational concerns too closely in some routes,
and lacks a production-grade migration and bootstrap story.

From a product perspective, the system needs to support real sign-up and
sign-in through **Auth0**, keep domain ownership in the backend, and make
authorization authoritative on the server side rather than implied by request
headers or transient process state. It also needs a stable public contract for
a future TypeScript client SDK, with clear error semantics and no leakage of
operational controls into user-facing APIs.

From an engineering perspective, the backend needs durable PostgreSQL storage,
explicit schema migrations, fail-fast boot checks, persisted audit records for
sensitive changes, and a centralized config bootstrap that behaves the same in
local development, tests, and production. Without these pieces, the system can
work in a demo setting but remains fragile under restart, redeploy, or
multi-instance operation.

The current state creates several risks:

- authentication is not yet real OIDC end to end
- authorization is still too close to request-time headers in some paths
- the production persistence layer is not yet PostgreSQL-backed
- there is no explicit migration bootstrap flow with schema validation on boot
- public and operational APIs are not fully separated by contract
- local `.env` loading is not centralized and can be missed by entrypoints or tests
- sensitive state changes are not yet durably recorded in an audit trail
- the future TypeScript SDK does not yet have a sufficiently stable backend
  contract to build against

## Solution

Turn the backend into a production-ready platform by introducing a clear
identity, authorization, persistence, and operational boundary model.

The target behavior is:

1. Local development and tests use a single explicit config bootstrap path that
   loads `.env` only in local contexts.
2. Production uses injected environment variables with strict validation and
   fast failure on missing required keys.
3. Public requests authenticate with Auth0 JWTs and resolve a typed
   authenticated actor.
4. The backend provisions and owns **Application User** state on first
   authenticated public request.
5. **Operator** access is modeled separately from application users and is
   controlled by backend-owned permissions.
6. Public APIs only act on the authenticated user's resources.
7. Operational APIs remain separate and protect privileged actions such as
   **Sync Run** and policy activation.
8. PostgreSQL becomes the system of record for operational state that must
   survive restarts.
9. SQL migrations are explicit, versioned, and run as a separate deployment
   step.
10. Boot fails if database readiness or schema version checks do not match the
    expected state.
11. Sensitive writes persist an audit trail in the same transaction as the
    business change.
12. The backend contract remains stable enough for a future TypeScript-native
    client SDK to consume directly.

This solution keeps the user-facing product surface simple while giving the
backend the durability, identity guarantees, and operational controls needed
for production.

## User Stories

1. As a customer, I want to sign in with Auth0, so that I can use the product
   with a real identity provider.
2. As a customer, I want my authenticated session to resolve to my backend user
   record, so that my data stays attached to my account.
3. As a customer, I want my account to be provisioned automatically on first
   login, so that I can start using the product without manual setup.
4. As a customer, I want public requests to apply only to my own resources, so
   that I do not accidentally see or modify someone else’s data.
5. As a customer, I want unauthorized requests to fail clearly, so that I know
   when I need to log in again.
6. As a customer, I want suspended access to be blocked consistently, so that
   account state is enforced across the public surface.
7. As a customer, I want the product to behave the same after a restart, so
   that I can trust the backend not to lose state.
8. As a customer, I want operational controls to stay out of the public API,
   so that the interface remains simple and safe.
9. As a customer, I want the backend to preserve my state across deploys, so
   that my work is not lost when the service restarts.
10. As a customer, I want clear errors when a request is malformed or stale,
    so that I can recover without guessing.
11. As a product user, I want the backend to resolve identity server-side, so
    that the client does not become the source of truth.
12. As a product user, I want the backend to own authorization decisions, so
    that access rules stay consistent across clients.
13. As a product user, I want stable error shapes from the API, so that a
    future SDK can handle failures predictably.
14. As a product user, I want the public API to stay focused on my own data, so
    that the product stays understandable.
15. As a product user, I want operational actions to be protected, so that
    support and admin operations cannot leak into normal usage.
16. As an operator, I want PostgreSQL to store the system of record, so that
    important backend state survives restarts and scaling events.
17. As an operator, I want schema migrations to be explicit and versioned, so
    that database changes are reproducible.
18. As an operator, I want boot to fail when the database schema is out of
    sync, so that broken deployments do not serve traffic.
19. As an operator, I want readiness checks to verify the backend can really
    serve requests, so that unhealthy instances do not receive traffic.
20. As an operator, I want sensitive mutations recorded in audit, so that I
    can reconstruct who changed what and when.
21. As an operator, I want audit records to be written durably with the write
    transaction, so that they cannot drift from the business state.
22. As an operator, I want local development to keep using `.env`, so that I
    can work without production secret injection.
23. As an operator, I want production to reject missing env configuration, so
    that misconfigured deployments fail fast.
24. As an operator, I want the backend to load configuration through one
    explicit bootstrap path, so that entrypoints do not drift over time.
25. As an operator, I want the authorization model to be backend-owned, so
    that permissions do not depend on client assertions.
26. As an operator, I want **Operator** access to be separate from **Application
    User** access, so that support and administration remain distinct from
    customer usage.
27. As an operator, I want the operational surface to remain isolated, so that
    privileged functions are not reachable through public routes.
28. As an operator, I want internal activation or support actions to be
    auditable, so that privileged changes are traceable.
29. As an operator, I want durable repositories for users, operators, role
    assignments, jobs, voice state, billing, idempotency, and audit, so that
    production state is stored in one place.
30. As an operator, I want idempotency keys persisted, so that retries do not
    duplicate side effects.
31. As an operator, I want restart recovery to preserve durable state, so that
    jobs and billing do not regress after a crash.
32. As an operator, I want the backend to separate configuration validation
    from business logic, so that deployment failures are easy to diagnose.
33. As a support engineer, I want to inspect public versus operational access
    boundaries, so that I can explain why a request was allowed or blocked.
34. As a support engineer, I want to know which authenticated actor made a
    change, so that I can investigate account actions accurately.
35. As a support engineer, I want audit and idempotency behavior to be
    deterministic, so that duplicate reports can be traced cleanly.
36. As a support engineer, I want consistent 401 and 403 semantics, so that I
    can distinguish unauthenticated from unauthorized access.
37. As a support engineer, I want the API contract to stay stable, so that a
    future SDK can surface errors and retries predictably.
38. As a support engineer, I want production failures to fail loudly at boot,
    so that latent misconfiguration is easier to spot.
39. As a developer, I want a deep configuration bootstrap module, so that env
    loading and validation are centralized and testable.
40. As a developer, I want a deep identity resolution module, so that JWT
    verification and actor mapping stay isolated.
41. As a developer, I want a deep authorization resolution module, so that
    access decisions are easy to reason about and test.
42. As a developer, I want a deep PostgreSQL repository layer, so that storage
    concerns are hidden behind a small interface.
43. As a developer, I want an explicit migration runner, so that schema changes
    are not hidden inside application startup.
44. As a developer, I want audit writing to be encapsulated, so that sensitive
    write behavior stays consistent across modules.
45. As a developer, I want public route handlers and operational route
    handlers to be distinct modules, so that the API boundary is visible in the
    code.
46. As a developer, I want the backend to validate database readiness at boot,
    so that integration failures are caught before serving traffic.
47. As a developer, I want repository behavior to be isolated from route
    handlers, so that application logic is easier to test.
48. As a developer, I want stable SDK-facing response shapes, so that future
    clients can rely on them without mirroring internal details.
49. As a developer, I want local test configuration to match development
    behavior, so that tests do not depend on hidden entrypoint imports.
50. As a future SDK maintainer, I want the backend to present a consistent
    contract, so that the client can be built without special cases.
51. As a future maintainer, I want database-backed production behavior to be
    explicit, so that the system can evolve safely after launch.

## Implementation Decisions

- Use **Auth0** as the managed OIDC provider for public authentication.
- Treat the backend as the owner of domain onboarding and local user state,
  rather than delegating that responsibility to the client.
- Model **Application User** as the primary user-owned domain boundary in v1.
- Model **Operator** separately from **Application User** so that support and
  administration permissions do not collapse into customer identity.
- Keep public and operational APIs strictly separated.
- Reserve bearer-token authentication for the public API surface.
- Resolve identity from the bearer token, but resolve canonical authorization
  from backend-owned state.
- Allow a short-lived authorization cache only when paired with explicit
  invalidation and backend-owned truth.
- Replace the in-memory production persistence path with PostgreSQL.
- Use Kysely as the runtime typed query builder for PostgreSQL access.
- Store production schema changes as hand-written, versioned SQL migrations in
  the repository.
- Run migrations as an explicit deployment step instead of hiding them in boot
  logic.
- Make boot fail fast when database readiness or schema version checks do not
  match expectations.
- Centralize configuration bootstrap so local dev, tests, and production share
  one explicit config model.
- Load `.env` only in local development and test contexts.
- Validate required production configuration from injected environment
  variables and fail immediately on missing keys.
- Persist audit records in the same write transaction as sensitive changes.
- Treat logs as observability, not as the source of truth for sensitive state
  changes.
- Introduce repositories for the persistent entities that matter in production,
  including users, operators, role assignments, jobs, voice state, billing,
  idempotency, and audit.
- Keep repository interfaces small and focused so they can be tested in
  isolation.
- Keep public route handlers user-owned and safe by construction.
- Keep operational route handlers separate and privilege-gated.
- Stabilize the backend contract for a future TypeScript-native client SDK.
- Prefer explicit error types and predictable HTTP semantics over generic
  fallback handling.
- Preserve local development ergonomics while making production configuration
  strict.
- Make the configuration bootstrap, identity resolution, authorization
  resolution, persistence access, migration runner, and audit writer the
  highest-leverage deep modules in this work.

## Testing Decisions

- Good tests must verify external behavior, invariants, and stable contracts
  rather than private helper structure.
- Good tests for this work should focus on observable outcomes: config
  bootstrap behavior, auth success and failure, authorization decisions, route
  separation, durable persistence, migration application, audit durability, and
  restart recovery.
- The config bootstrap should be tested for `.env` loading in local contexts,
  missing required production keys, and clear failure behavior.
- Identity resolution should be tested for valid Auth0 JWT acceptance, invalid
  token rejection, and stable actor mapping.
- Authorization resolution should be tested for user-owned access, operator
  permissions, and consistent 401 versus 403 semantics.
- PostgreSQL repositories should be tested for durable writes, reads after
  restart, idempotency handling, and entity ownership rules.
- Migration bootstrapping should be tested for ordered application, schema
  version validation, and failure on mismatch.
- Public route handlers should be tested to ensure they only act on the
  authenticated user's resources and never expose operational controls.
- Operational route handlers should be tested to ensure they require operator
  permissions and remain isolated from public access.
- Audit behavior should be tested to ensure sensitive writes and audit records
  land in the same transaction.
- Restart recovery behavior should be tested to ensure durable state survives a
  process restart without losing authorization, billing, or job records.
- Prior art for these tests should come from the existing backend application
  tests, product service tests, execution tests, repository tests, and
  configuration tests already present in the monorepo.

## Out of Scope

- Organization tenancy as a first-class v1 model.
- A browser-cookie BFF for the central API.
- A non-TypeScript SDK.
- OpenAPI as the primary source of truth for the backend contract.
- Replacing the current contract system with a generic API platform.
- Making the client responsible for authorization, provisioning, or identity
  resolution.
- Automatic downgrade or degraded startup that skips database readiness checks.

## Further Notes

- This PRD assumes the project glossary in `CONTEXT.md` is canonical,
  especially **Application User**, **Operator**, **Sync Run**, and the
  public-versus-operational surface split.
- The deepest modules in this work should be the config bootstrap, identity
  resolution, authorization resolution, PostgreSQL repository layer, migration
  runner, and audit writer.
- The implementation should preserve the principle that the client is a
  consumer of the backend contract, not the owner of authentication,
  authorization, or persistence rules.
