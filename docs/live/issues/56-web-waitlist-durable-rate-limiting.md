---
title: Web Waitlist Durable Rate Limiting
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-14
---

# Web waitlist durable rate limiting

## Parent

- [`issue-durable-async-runtime.md`](../prd/issue-durable-async-runtime.md)
- ADR: [`0004-durable-async-runtime-zero-in-process-state.md`](../../adr/0004-durable-async-runtime-zero-in-process-state.md)

## What to build

Remove in-memory `rateLimitStore` from `apps/web/src/lib/server/handle-waitlist-request.ts`.

Options (pick one in implementation, document in PR):

- Call shared Redis rate limit from web server (Upstash REST or `REDIS_URL`).
- Delegate waitlist POST to backend public endpoint with durable limit.
- Rely on Vercel edge rate limit + minimal server check.

Preserve existing `WaitlistRateLimitedError` / `rate_limited` response shape.

## Acceptance criteria

- [ ] No module-level `Map` for waitlist rate limiting in `apps/web`.
- [ ] Rate limit enforced across web server restarts (integration or manual test documented).
- [ ] Existing waitlist tests updated and green.

## Blocked by

- 55 (shared `RateLimitStore` pattern preferred)
