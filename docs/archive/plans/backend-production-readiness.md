---
title: Backend Production Readiness Plan
doc_type: coordination
status: active
domain: backend-production
last_updated: 2026-05-27
---

# Backend Production Readiness Plan

This workstream turns the current backend into a production-ready system with durable data, real authentication, explicit authorization, operational separation, and a stable contract for a future TypeScript client SDK.

## Goal

Make the backend safe to expose to real users by ensuring:

- Auth0 owns sign-up and sign-in
- the backend owns domain onboarding and local user state
- public and operational APIs are strictly separated
- PostgreSQL is the system of record
- authorization is resolved server-side, with short-lived cache only
- sensitive changes are recorded in a persisted audit trail
- local development keeps working with `.env` while production uses injected secrets

## Current Baseline

The repository already has:

- a TypeScript monorepo with the backend in `apps/backend`
- a domain glossary in `CONTEXT.md`
- a set of live ADRs for the major decisions already taken
- an in-memory database implementation that is adequate for tests but not production
- a backend config reader that maps `process.env` into typed config

The backend is not production-ready yet because:

- auth is not real OIDC yet
- authorization is still too close to request headers in some paths
- the main persistence layer is in-memory
- there is no PostgreSQL migration/bootstrap flow
- the operational and public surfaces are not fully hardened for real traffic
- local `.env` loading is not centralized, so tests and helpers can miss it

## Decisions Already Locked

- Auth0 is the managed OIDC provider
- `User` is the primary tenant boundary in v1
- `Application User` is the backend-owned ownership root
- `Operator` is separate from `Application User`
- public and operational surfaces are separate
- `Sync Run` belongs to the operational surface
- bearer token only on the public API
- token establishes identity, backend database establishes canonical authorization
- short-lived authorization cache is allowed with explicit invalidation
- PostgreSQL is the system of record
- Kysely is the typed query builder for runtime
- SQL migrations are hand-written and versioned in-repo
- migrations run as an explicit deploy step
- startup fails fast if DB readiness or schema version is wrong
- `.env` is for local/dev/test only
- audit trail is persisted in the write transaction
- the future client SDK is TypeScript-native and is the primary API consumer

## Implementation Order

### Phase 0: Configuration Bootstrap

Fix local and test configuration loading so the backend does not depend on one entrypoint importing `dotenv/config`.

Output expected:

- one explicit config bootstrap path for dev and tests
- `.env` loading only in local contexts
- production config validation from injected env vars
- clear failure when required keys are missing

Why first:

- this unblocks local execution and makes later backend work repeatable
- it removes hidden coupling between `main.ts` and config loading

### Phase 1: Identity and Authorization Foundation

Introduce real Auth0-based request identity and canonical authorization resolution.

Output expected:

- JWT verification against Auth0
- identity resolution into a typed `Authenticated Actor`
- local `Application User` JIT provisioning on first authenticated public request
- explicit `Operator` provisioning and grants
- public surface access blocked when local user state is suspended
- operational surface access controlled by backend-owned roles and permissions

Why second:

- every protected route depends on a stable identity and authorization model

### Phase 2: PostgreSQL System of Record

Replace the in-memory production persistence path with PostgreSQL-backed storage.

Output expected:

- PostgreSQL connection bootstrap
- Kysely runtime access layer
- explicit SQL migrations in the repository
- schema version validation on boot
- repositories for users, operators, role assignments, jobs, voice state, billing, idempotency, and audit

Why third:

- auth and authorization need durable ownership and operational state
- jobs, billing, and audit are not production-safe without durable persistence

### Phase 3: Public API Hardening

Make the public authenticated API strictly user-owned and safe by construction.

Output expected:

- public routes only operate on the authenticated user's resources
- no implicit cross-user listing
- no fallback to configuration-driven identity on public requests
- consistent 401/403 semantics
- stable error shapes for SDK consumption

Why fourth:

- the public surface is the highest-risk user-facing contract

### Phase 4: Operational API Separation

Keep privileged and debug-oriented actions on the operational surface only.

Output expected:

- internal routes isolated from public routes
- `Sync Run` exposed only on the operational surface
- policy activation protected by operator permissions
- billing and support operations remain operational-only
- operator access changes recorded in audit

Why fifth:

- operational controls must not leak into the public contract

### Phase 5: Audit and Billing Integrity

Make sensitive writes accountable and durable.

Output expected:

- persisted audit events in the same transaction as sensitive writes
- billing changes recorded durably
- identity and authorization mutations recorded durably
- idempotency keys persisted
- no reliance on logs as the source of truth for sensitive decisions

Why sixth:

- accountability is required once the state is durable and writable

### Phase 6: SDK Contract and Public API Boundary

Stabilize the contract that the future TypeScript client SDK will consume.

Output expected:

- shared contracts package remains the source of truth
- client SDK shape is documented and aligned with backend responses
- OpenAPI may be derived if needed, but it is not the primary contract source
- request/response and error semantics are stable enough for SDK integration

Why seventh:

- the SDK should land on a stable backend contract, not vice versa

### Phase 7: Production Hardening and Verification

Close the remaining production gaps with security and operational checks.

Output expected:

- security headers and CORS policy
- rate limiting strategy
- structured logs with sensitive redaction
- health/readiness checks
- deploy validation checklist
- end-to-end tests for auth, ownership, revocation, migrations, and restart recovery

Why last:

- these controls should validate the finished shape of the system, not a half-built one

## Module Boundaries To Preserve

- config bootstrap
- auth identity verification
- authorization resolution
- application-user provisioning
- operator provisioning and grants
- Postgres repositories
- migrations
- audit trail writer
- public route handlers
- operational route handlers
- SDK-facing contracts

## Testing Strategy

Tests should verify behavior at the boundaries:

- local config bootstrap loads `.env` in dev/test
- missing required config fails fast
- Auth0 JWT verification accepts valid tokens and rejects invalid ones
- public routes reject unauthorized or suspended access
- public routes stay user-owned
- operational routes require operator permissions
- PostgreSQL migrations apply in order
- boot fails on schema mismatch
- audit events are written with the same transactional change
- idempotency prevents duplicate side effects
- restart recovery keeps durable state intact

## Definition Of Done

This workstream is done when:

- the backend boots locally and in production with the same explicit config model
- Auth0-backed auth works end to end
- public and operational surfaces are separated in code and tests
- PostgreSQL persists the operational state that matters
- migrations are explicit and validated
- audit trail is durable
- the client SDK contract is stable enough to start building against

## Out Of Scope For This Phase

- organization tenancy as a first-class v1 model
- a browser-cookie BFF for the central API
- a non-TypeScript SDK
- OpenAPI as the primary source of truth
- replacing the existing contract system with a generic API platform
