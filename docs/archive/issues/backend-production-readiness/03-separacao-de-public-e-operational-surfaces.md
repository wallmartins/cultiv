---
title: Separacao De Public E Operational Surfaces
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Separacao De Public E Operational Surfaces

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Split the backend API into a strictly user-owned public surface and a separate
operational surface for privileged actions.

This slice should prove end-to-end behavior that:

- public routes only act on the authenticated user's resources resolved from
  the Auth0-backed actor established in issue 02
- no cross-user access is possible through public endpoints
- operational routes are gated by backend-owned operator permissions and do not
  rely on public bearer tokens alone
- privileged actions remain out of the public API contract

Implementation expectations for this slice:

- keep public route handlers thin and explicit about the authenticated actor
- ensure public reads and writes are scoped to the caller's own backend-owned
  user identity
- stop public route code from reading identity directly from request headers or
  route-local fallbacks
- make operational routing and permission checks separate from public auth
  parsing
- preserve stable public error semantics when access is denied
- keep the route boundary testable without standing up full production
  infrastructure
- keep public ownership checks consistent across reads, writes, queued jobs, and
  event-stream endpoints
- ensure the same authenticated actor model is used by route handlers and any
  supporting service layer entrypoints they call
- keep operator-only actions reachable only through the operational surface, not
  through public auth claims alone

## Acceptance criteria

- [x] Public routes reject cross-user access attempts and only operate on the authenticated user's resources.
- [x] Operational routes require operator-level authorization.
- [x] The authenticated actor established by issue 02 is the only identity source public routes use.
- [x] Public route ownership checks behave consistently for direct requests and secondary actions such as job lookup or event streaming.
- [x] Public and operational behavior are separable enough to be tested through the route layer.

## Blocked by

- `02-auth0-jwt-e-resolucao-de-application-user.md`
