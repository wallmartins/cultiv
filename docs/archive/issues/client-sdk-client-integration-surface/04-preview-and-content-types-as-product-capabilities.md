---
title: Preview And Content Types As Product Capabilities
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Preview And Content Types As Product Capabilities

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Deliver **Generation Preview** and **Content Type** access as first-class
product capabilities in the SDK so a frontend can build the entry flow for
generation without direct backend HTTP calls.

This slice should prove end-to-end that:

- the SDK exposes stable preview and content type capabilities instead of raw
  route wrappers
- the frontend can retrieve allowed options and preview pricing through the SDK
- route semantics remain hidden behind product language

## Acceptance criteria

- [ ] The SDK exposes `preview.get` and `contentTypes.list` as flat domain methods.
- [ ] `preview.get` accepts `GenerationPreviewRequest` and returns `GenerationPreviewResponse`.
- [ ] `contentTypes.list` returns `ContentTypeCatalogView`.
- [ ] A frontend can retrieve generation preview data and content type catalog data without direct backend route knowledge.
- [ ] The public SDK surface for these flows uses product capability language rather than raw route wrappers.
- [ ] Both methods support `signal?: AbortSignal` for cancellation.

## Blocked by

- `03-framework-agnostic-client-sdk-core-with-authenticated-transport.md`
