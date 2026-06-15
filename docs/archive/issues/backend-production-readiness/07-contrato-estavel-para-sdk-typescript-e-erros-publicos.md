---
title: Contrato Estavel Para Sdk Typescript E Erros Publicos
doc_type: issue
status: ready-for-agent
domain: backend-production
last_updated: 2026-05-28
---

# Contrato Estavel Para Sdk Typescript E Erros Publicos

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Stabilize the backend contract that a future TypeScript client SDK will
consume, including predictable public errors and response shapes.

This slice should prove end-to-end behavior that:

- public responses are consistent enough for SDK consumption
- authentication and authorization failures have stable semantics
- operational concerns are not leaked into the public API contract
- Auth0-specific failures are normalized into the same public error model the
  SDK can consume

Implementation expectations for this slice:

- define one stable public error envelope for unauthenticated, unauthorized,
  stale, and invalid-request cases
- keep the public error envelope structurally simple enough for a generated SDK
  to classify without parsing free-form prose
- preserve distinct semantics for missing token, invalid token, expired token,
  and insufficient permission responses
- keep 401 responses for authentication failures and 403 responses for
  authorization failures unless a route intentionally uses another public code
- keep response shapes predictable enough for generated or hand-written SDK
  clients to classify errors without inspecting internal stack traces
- avoid exposing provider-specific auth details in the public contract
- ensure the contract remains compatible with the new Auth0-backed identity
  flow and the public/operational split
- keep the SDK-facing shape aligned with the route layer rather than with
  internal service internals
- document the normalized public error fields once and reuse them across all
  protected public endpoints
- keep quote mismatch, stale preview, and auth failures visually distinct in the
  error model so client recovery paths stay obvious
- make sure operational-only routes do not leak additional internal error shape
  variants into the public API contract

## Acceptance criteria

- [ ] Public API responses and errors are stable enough for a TypeScript SDK.
- [ ] 401 and 403 behavior is consistent and distinguishable.
- [ ] Auth0-related auth failures are normalized into the same public error envelope.
- [ ] The public error envelope can be classified by a client without reading stack traces or provider-specific messages.
- [ ] The public contract can be verified through the route surface without depending on internal implementation details.

## Blocked by

- `02-auth0-jwt-e-resolucao-de-application-user.md`
- `03-separacao-de-public-e-operational-surfaces.md`
- `05-migrations-e-validacao-de-schema-no-boot.md`
- `06-audit-trail-duravel-para-mutacoes-sensiveis.md`
