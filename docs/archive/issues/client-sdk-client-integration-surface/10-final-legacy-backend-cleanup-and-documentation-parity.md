---
title: Final Legacy Backend Cleanup And Documentation Parity
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Final Legacy Backend Cleanup And Documentation Parity

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Complete the cleanup of legacy public generation routes and align live docs,
contracts, SDK behavior, and backend surface around the canonical product
client boundary.

This slice should prove end-to-end that:

- legacy public pipeline/job routes are no longer part of the product-facing
  backend surface
- the SDK contains no first-class legacy pipeline/job capabilities
- docs, contracts, SDK, and backend all describe the same client boundary

## Acceptance criteria

- [ ] Legacy public pipeline/job routes (`/api/pipelines`, `/api/jobs`) are removed from the product-facing backend surface.
- [ ] The SDK exposes no first-class pipeline/job client capabilities.
- [ ] The SDK exposes only `preview`, `executions`, `voice`, and `contentTypes` subclients with flat domain methods.
- [ ] Live docs, contracts, SDK behavior, and backend surface are aligned around the canonical product client boundary.
- [ ] The `client-sdk-design.md` design document is the authoritative SDK reference.

## Blocked by

- `01-canonical-public-surface-and-legacy-contract-removal.md`
- `02-complete-typed-contracts-for-the-client-integration-surface.md`
- `04-preview-and-content-types-as-product-capabilities.md`
- `05-canonical-executions-with-execution-identity-and-resume.md`
- `06-execution-watch-with-typed-transitions-and-active-session-completion-notification.md`
- `08-voice-profile-and-voice-examples-end-to-end-in-the-sdk.md`
- `09-governance-against-direct-backend-bypass-from-apps.md`
