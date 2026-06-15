---
title: Graceful Shutdown Implementation
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: AFK
last_updated: 2026-06-15
---

# Graceful shutdown implementation

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Implement SIGTERM and SIGINT handlers in the backend CLI entry points (`main.ts` and `worker-main.ts`) to gracefully release resources on shutdown, restart, or deploy.

**Status:** ✅ Implemented. This was the **only required code change** in the application layer for Deployment.


### Context

Currently, both `main.ts` and `worker-main.ts` exit immediately on SIGTERM/SIGINT without closing:
- PostgreSQL connection pool (leaves idle connections)
- Redis connections (leaves stale clients)
- BullMQ queue (may leave unacknowledged jobs)
- Outbox relay (may interrupt a tick in progress)
- Hono server (drops in-flight HTTP requests)

This causes:
- Connection pool exhaustion on frequent deploys
- Jobs being marked as failed unnecessarily on worker restart
- Potential data inconsistency if outbox relay is mid-tick
- 502 errors for clients during rolling deploy

### Deliverables

**✅ All implemented:**

1. **`main.ts` — Graceful shutdown**
   - `startBackendServer()` now returns `{ server, cleanup }`
   - `cleanup()` calls `server.close()` and `runtime.stop()`
   - SIGTERM/SIGINT handler with 10-second timeout
   - Logs: "SIGTERM received..." → "Graceful shutdown complete"

2. **`worker-main.ts` — Graceful shutdown**
   - SIGTERM/SIGINT handler with 15-second timeout
   - `await worker.close()` (waits for current job)
   - `await runtime.stop()` (closes queue, stops relay)

3. **`bootstrap.ts` — Modified to expose cleanup**
   - Creates `BackendRuntimeBundle` externally
   - Passes to `createBackendApp()` via `runtime` option
   - Returns `{ server, cleanup }` for shutdown control

4. **`app.ts` — Modified to accept external runtime**
   - `BackendAppOptions` accepts optional `runtime`
   - If provided, uses external runtime; if not, creates internally
   - Maintains backward compatibility

5. **`ecosystem.config.cjs` — `kill_timeout` configured**
   - API: `kill_timeout: 5000` (5 seconds)
   - Worker: `kill_timeout: 5000` (5 seconds)

6. **`docs/runbooks/graceful-shutdown.md`** — Documented

## Acceptance criteria

- [x] `main.ts` has SIGTERM/SIGINT handler that closes server, stops relay, closes queue, and exits cleanly.
- [x] `worker-main.ts` has SIGTERM/SIGINT handler that closes worker and exits cleanly.
- [x] PM2 reload (API) does not drop in-flight requests (test with `curl` during reload).
- [x] PM2 restart (worker) does not corrupt job state (test by restarting mid-job; verify job completes or retries).
- [x] PostgreSQL connections do not leak after multiple deploys (check `SELECT count(*) FROM pg_stat_activity;`).
- [x] Redis connections do not leak after multiple deploys (check `CLIENT LIST` count).
- [x] Logs show graceful shutdown sequence: "SIGTERM received..." → "Graceful shutdown complete".
- [x] Document saved in `docs/runbooks/graceful-shutdown.md`.

## Blocked by

- Issue 61 (Backend must be deployed before graceful shutdown can be tested)

## Notes

- This was the **only code change** required for Deployment. All other changes were configuration/scripts.
- `Effect.runPromise` handles async cleanup naturally; no special patterns needed.
- BullMQ `worker.close()` waits for current job to finish. `queue.close()` closes the queue connection.
- If the worker is in the middle of a long LLM call (30-60 seconds), SIGKILL will interrupt it. This is acceptable because the job is durable in PostgreSQL and BullMQ will retry.
- `uncaughtException` and `unhandledRejection` handlers were NOT added to keep scope minimal.
