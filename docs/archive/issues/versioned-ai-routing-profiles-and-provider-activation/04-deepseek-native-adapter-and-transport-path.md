---
title: DeepSeek Native Adapter And Transport Path
doc_type: issue
status: ready-for-agent
domain: ai-implementation
last_updated: 2026-05-26
---

# DeepSeek Native Adapter And Transport Path

## Parent

- `docs/archive/prd/versioned-ai-routing-profiles-and-provider-activation.md`

## What to build

Build the slice that adds DeepSeek as a native provider-specific integration in
the shared adapter and transport boundary so the backend can execute DeepSeek
attempts through the same runtime path used by existing providers.

This slice should prove the end-to-end behavior that:

- DeepSeek has provider-specific request construction and response
  normalization
- DeepSeek transport uses typed configuration and transport failures
- DeepSeek can participate in the shared runtime without compatibility shims at
  the route layer

## Acceptance criteria

- [ ] DeepSeek is registered as a native provider in the adapter service with provider-specific request and response handling.
- [ ] Backend transport can execute DeepSeek requests with typed configuration and typed transport failures.
- [ ] DeepSeek provider behavior is covered by adapter-level and backend-facing tests that assert external contract behavior.

## Blocked by

- `01-routing-profile-schema-and-boot-validation.md`
