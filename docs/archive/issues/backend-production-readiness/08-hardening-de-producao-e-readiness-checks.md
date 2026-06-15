---
title: Hardening De Producao E Readiness Checks
doc_type: issue
status: ready-for-agent
domain: backend-production
last_updated: 2026-05-28
---

# Hardening De Producao E Readiness Checks

## Parent

- `docs/archive/prd/backend-production-readiness.md`

## What to build

Add the production hardening and readiness controls needed for a safe launch.

This slice should prove end-to-end behavior that:

- production readiness checks gate traffic correctly
- health and readiness behavior reflects actual backend capability, including
  database, config, and Auth0 readiness
- operational and security controls are present before production exposure

Implementation expectations for this slice:

- expose a readiness signal that reflects the full production dependency chain,
  not just process liveness
- include checks for config validity, auth bootstrap readiness, and database
  availability in the readiness decision
- keep the readiness signal separate from the lightweight liveness probe so
  uptime monitoring does not accidentally become deployment gating
- keep dev and test behavior simple, but make production readiness strict and
  honest
- separate health checks that are safe for uptime monitoring from readiness
  checks that gate actual traffic
- ensure a healthy signal is only returned when the backend can actually serve
  authenticated public requests and durable writes
- make the hardening path observable through logs or structured diagnostics
  without leaking sensitive material
- keep the production hardening module isolated enough to be tested with
  controlled environment inputs
- avoid coupling readiness to any one route or business workflow
- treat security headers, CORS policy, and rate limiting as production-facing
  safeguards that are validated through observable behavior
- define which checks run on startup versus per-request versus probe endpoints so
  the responsibilities do not blur
- keep production hardening aligned with the backend's current public and
  operational route split
- ensure readiness failures are explicit enough that deploy tooling and
  operators can tell whether the backend is blocked by config, auth, or data
  layer state

## Acceptance criteria

- [ ] Readiness checks prevent unhealthy instances from serving traffic.
- [ ] The backend exposes operational health signals that reflect real database, config, and Auth0 readiness.
- [ ] Health and readiness checks are separated so uptime probing does not become a traffic gate by accident.
- [ ] Liveness remains lightweight while readiness remains strict and dependency-aware.
- [ ] Production-only safeguards are validated through behavior rather than by reading hidden state.
- [ ] Production hardening is validated through observable behavior rather than hidden assumptions.

## Blocked by

- `02-auth0-jwt-e-resolucao-de-application-user.md`
- `03-separacao-de-public-e-operational-surfaces.md`
- `04-postgresql-sistema-de-registro.md`
- `05-migrations-e-validacao-de-schema-no-boot.md`
- `06-audit-trail-duravel-para-mutacoes-sensiveis.md`
