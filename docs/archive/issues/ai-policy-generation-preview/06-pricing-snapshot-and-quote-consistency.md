---
title: Pricing Snapshot And Quote Consistency
doc_type: issue
status: completed
domain: ai-implementation
last_updated: 2026-05-22
---

# Pricing Snapshot And Quote Consistency

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that produces a deterministic `quoteId` from the commercial
**Pricing Snapshot** and rejects public execution when any commercial field
diverges from the provided quote.

This slice should prove the end-to-end behavior that:

- preview and execution use the same pricing logic
- public execution can detect stale commercial snapshots
- stale quote recovery requires a fresh preview rather than a silent repricing

Implementation guardrails:

- follow `software-engineering` and `effect-ts` guidelines
- keep quote hashing tied only to the commercial promise, not internal fallback
  behavior

## Acceptance criteria

- [x] Generation Preview can produce a deterministic `quoteId` from the commercial pricing snapshot.
- [x] Public execution rejects a mismatched or stale quote when any commercial field diverges.
- [x] The failure contract clearly indicates that the client must refresh preview before confirming generation again.

## Blocked by

- `04-generation-preview-read-model.md`
