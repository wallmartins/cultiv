---
title: Governance Against Direct Backend Bypass From Apps
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Governance Against Direct Backend Bypass From Apps

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Add enforceable governance so `apps/web` and `apps/mobile` cannot bypass the
**Client Integration Surface** with direct backend calls once preview,
executions, and voice capabilities are available in the SDK.

This slice should prove end-to-end that:

- approved frontend integrations go through the SDK
- direct backend access from frontend apps is detectable and rejected
- lint rules prohibit imports of HTTP clients (`fetch`, `axios`, `ky`) in
  `apps/web` and `apps/mobile`, allowing only `@my-ai-orchestrator/client-sdk`
- architectural tests verify that frontend packages do not depend on backend
  route constants or URL patterns
- the architecture boundary is enforced by automated checks in both dev and
  production environments

## Acceptance criteria

- [ ] Automated governance detects direct backend HTTP integrations from frontend apps.
- [ ] Approved frontend integration paths flow through the SDK instead of direct backend route access.
- [ ] The repository contains a clear automated boundary that prevents frontend bypass of the SDK.

## Blocked by

- `04-preview-and-content-types-as-product-capabilities.md`
- `05-canonical-executions-with-execution-identity-and-resume.md`
- `08-voice-profile-and-voice-examples-end-to-end-in-the-sdk.md`
