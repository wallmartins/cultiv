---
title: Alinhamento de Rastreabilidade e Documentacao
doc_type: issue
status: completed
domain: backend-production
last_updated: 2026-05-28
---

# Alinhamento de Rastreabilidade e Documentação

## Parent

- `docs/archive/prd/backend-production-readiness.md`
- `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md`

## What to build

Align all tracking artifacts so that issue status, acceptance criteria, and implementation tracker reflect the real state of the codebase. This is a process slice with no runtime code changes.

This slice should ensure that:

- the original Issue 2 accurately describes what is done and what remains
- the implementation tracker lists the new corrective slices and their dependencies
- reviewers and future agents can trust the issue state without re-auditing the code

## Acceptance criteria

- [x] `docs/archive/issues/backend-production-readiness/02-auth0-jwt-e-resolucao-de-application-user.md` is updated:
  - checkboxes reflect real completion (all 9 ACs satisfied)
  - status changed from `in_progress` to `completed`
  - note references the corrective issues (09–13)
- [x] `.scratch/backend-production-readiness/IMPLEMENTATION-TRACKER.md` is updated:
  - Issue 2 status reflects full completion
  - Issues 09–13 are marked completed with correct dependencies
  - milestone checklist updated; Milestone 1 is completed
  - "Current Focus" and "Next Recommended Step" point to Issue 4
- [x] `docs/archive/issues/backend-production-readiness/01-config-bootstrap-unificada-para-dev-test-e-prod.md` checkboxes verified as complete; no changes needed.
- [x] ADR `0027-local-userid-is-backend-owned-not-external-sub.md` added to `docs/archive/adr/` documenting that `userId` in public routes refers to the backend-owned local `ApplicationUser.id`, not the external Auth0 `sub`.

## Blocked by

None - can start immediately.
