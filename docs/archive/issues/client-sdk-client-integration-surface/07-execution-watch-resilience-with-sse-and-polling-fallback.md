---
title: Execution Watch Resilience With SSE And Polling Fallback
doc_type: issue
status: ready-for-agent
domain: client-integration-surface
last_updated: 2026-06-03-refined
---

# Execution Watch Resilience With SSE And Polling Fallback

## Parent

- `docs/archive/prd/client-sdk-client-integration-surface.md`

## What to build

Add bounded **Execution Watch Resilience** so observation recovery remains
inside the SDK through preferred SSE behavior with reconnect, retry, and
polling fallback before surfacing typed failure to the app.

This slice should prove end-to-end that:

- SSE is the preferred observation path (`/me/executions/:id/events`)
- bounded retry and reconnect behavior stays inside the SDK
- max 5 SSE reconnect attempts with exponential backoff (base 1s)
- fallback to polling `GET /me/executions/:id` every 5 seconds
- max 12 polling failures tolerated
- total observation timeout of 10 minutes
- polling fallback preserves observation when SSE cannot continue
- after exhaustion, `onObservationFailure` receives a typed `ClientSdkObservationFailure`

## Acceptance criteria

- [ ] Execution observation prefers SSE but can continue through bounded retry and reconnect behavior.
- [ ] Polling fallback is available inside the SDK when SSE observation cannot continue.
- [ ] The app receives typed observation failure only after bounded recovery is exhausted.

## Blocked by

- `06-execution-watch-with-typed-transitions-and-active-session-completion-notification.md`
