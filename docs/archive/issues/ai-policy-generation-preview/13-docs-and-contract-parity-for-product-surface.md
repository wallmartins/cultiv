---
title: Docs And Contract Parity For Product Surface
doc_type: issue
status: implemented
domain: ai-implementation
last_updated: 2026-05-16
---

# Docs And Contract Parity For Product Surface

## Parent

- `docs/archive/prd/ai-policy-generation-preview.md`

## What to build

Build the slice that aligns live docs and public contract references with the
new product-oriented generation surface, including **Generation Preview**,
quote mismatch semantics, and internal-only pipeline control.

This slice should prove the end-to-end behavior that:

- active docs describe the same public product contract the backend exposes
- preview and generation semantics are documented consistently
- internal pipeline control is clearly marked as non-public

Implementation guardrails:

- follow `software-engineering` guidelines for clarity and simplicity
- keep docs organized by responsibility and avoid stale duplicated narratives

## Acceptance criteria

- [x] Live docs describe Generation Preview, quote consistency behavior, and product-oriented generation consistently.
- [x] Public contract references no longer imply that explicit pipeline control is the primary public generation path.
- [x] Internal-only pipeline and experimental flow semantics are documented clearly enough for future contributors to follow.

## Blocked by

- `04-generation-preview-read-model.md`
- `06-pricing-snapshot-and-quote-consistency.md`
- `07-product-oriented-public-generation-command.md`
- `11-preview-to-execution-trace-correlation.md`
