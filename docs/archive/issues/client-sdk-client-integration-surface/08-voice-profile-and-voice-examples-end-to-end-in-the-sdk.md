---
title: Voice Profile And Voice Examples End To End In The SDK
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Voice Profile And Voice Examples End To End In The SDK

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Deliver **Voice Profile**, **Voice Examples**, and voice batch workflows as
first-class product capabilities in the SDK so onboarding and voice management
can be built without direct backend HTTP integrations.

This slice should prove end-to-end that:

- the SDK exposes profile, example, and batch capabilities through product
  semantics as flat domain methods
- `voice.getProfile`, `voice.listExamples`, `voice.createExample`,
  `voice.updateExample`, `voice.createBatch`, `voice.addBatchItems`,
  `voice.commitBatch`
- frontend onboarding and voice management flows can use only the SDK
- raw route semantics remain hidden behind the client boundary
- all methods support `signal?: AbortSignal` for cancellation

## Acceptance criteria

- [ ] The SDK exposes typed capabilities for voice profile retrieval, voice example listing/creation/update, and batch flows.
- [ ] Voice onboarding and management flows can be implemented without direct backend HTTP calls outside the SDK.
- [ ] The public SDK surface for voice uses product capability language instead of raw route wrappers.

## Blocked by

- `03-framework-agnostic-client-sdk-core-with-authenticated-transport.md`
