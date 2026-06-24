---
title: Webhook Verification Test Suite
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-24
---

# Webhook Verification Test Suite

## Parent

- [`issue-code-quality-scale-readiness.md`](../prd/issue-code-quality-scale-readiness.md)
- Payments package tests (prior art: `stripe-webhook.test.ts`)

## What to build

Direct route-level tests for **billing webhooks** not covered today:

- `POST /webhooks/stripe` — invalid signature → 4xx; valid fixture → 200; duplicate event idempotent
- `POST /webhooks/asaas` — same matrix if adapter supports verification

Use fixtures from `tests/fixtures/billing/`. No real network calls.

## Acceptance criteria

- [ ] Stripe webhook rejection test for bad signature.
- [ ] Idempotent replay test (second POST same event id does not double-apply).
- [ ] Asaas covered or explicitly skipped with documented reason in test.
- [ ] Tests run in `pnpm test:ci:backend`.

## Blocked by

None — can start immediately.
