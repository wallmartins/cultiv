---
title: Integrator Deploy Verification and Go-Live
doc_type: issue
status: ready-for-agent
domain: backend-platform
slice_type: HITL
last_updated: 2026-06-15
---

# Deploy verification and go-live

## Parent

- [`issue-integrator-cloudflare-deploy.md`](../prd/issue-integrator-cloudflare-deploy.md)
- ADR: [`0005-integrator-cloudflare-deploy.md`](../../adr/0005-integrator-cloudflare-deploy.md)

## What to build

Perform end-to-end verification of the entire Integrator + Cloudflare deployment. Sign off the go-live checklist and transition from the legacy Railway deployment (or establish the first production deployment if none exists yet).

**Status:** ✅ Scripts and runbooks implemented. Ready for execution on provisioned VM.

### Deliverables

1. **Go-live checklist**

   | # | Check | Method | Pass |
   |---|-------|--------|------|
   | 1 | VM provisioned and accessible via Cloudflare Zero Trust SSH | `cloudflared access ssh --hostname ssh.cultiv.app` | ⬜ |
   | 2 | Cloudflare Tunnel active | Cloudflare Zero Trust dashboard | ⬜ |
   | 3 | DNS resolves to Cloudflare | `dig api.cultiv.app` | ⬜ |
   | 4 | SSL certificate valid | `curl -v https://api.cultiv.app/health` | ⬜ |
   | 5 | WAF rules active | Cloudflare Security Events dashboard | ⬜ |
   | 6 | PostgreSQL running | `docker ps | grep cultiv-postgres` | ⬜ |
   | 7 | Redis running | `docker ps | grep cultiv-redis` | ⬜ |
   | 8 | API running | `pm2 status` shows `cultiv-api` online | ⬜ |
   | 9 | Worker running | `pm2 status` shows `cultiv-worker` online | ⬜ |
   | 10 | Health check passes | `curl https://api.cultiv.app/health` → 200 | ⬜ |
   | 11 | Readiness passes | `curl https://api.cultiv.app/ready` → `status: ready` | ⬜ |
   | 12 | Metrics endpoint works | `curl https://api.cultiv.app/metrics` → JSON | ⬜ |
   | 13 | Auth0 JWT validates | `curl` with test token to protected endpoint | ⬜ |
   | 14 | End-to-end job enqueue | `POST /me/executions/run` → 202 | ⬜ |
   | 15 | Worker completes job | SSE or `GET /me/executions/:id` shows `done` | ⬜ |
   | 16 | Outbox relay works | `SELECT COUNT(*) FROM outbox_events WHERE published_at IS NULL` = 0 after job completes | ⬜ |
   | 17 | Health check script active | `tail /home/ubuntu/cultiv/logs/health-check.log` shows recent run | ⬜ |
   | 18 | Discord alerts work | Simulate failure, verify alert received | ⬜ |
   | 19 | UptimeRobot monitoring | Dashboard shows "Up" status | ⬜ |
   | 20 | Backup completed | `ls /home/ubuntu/cultiv/backups/` shows recent file | ⬜ |
   | 21 | Backup uploaded to Object Storage | `rclone copy list ":s3:cultiv-backups"` shows recent object | ⬜ |
   | 22 | Deploy pipeline works | Push to `main`, verify GitHub Actions green | ⬜ |
   | 23 | Deploy notification received | Discord shows "✅ Deploy successful" | ⬜ |
   | 24 | Graceful shutdown works | `pm2 reload cultiv-api`, verify no dropped requests | ⬜ |
   | 25 | Frontend calls API successfully | `apps/web` (Vercel) can call `https://api.cultiv.app` | ⬜ |
   | 26 | CORS configured | Browser request from `cultiv.app` succeeds | ⬜ |
   | 27 | Rate limiting works | `curl` rapid-fire, verify 429 after limit | ⬜ |
   | 28 | Runbook documented | `docs/runbooks/integrator-deploy.md` exists and is accurate | ⬜ |
| 29 | Cloudflare Zero Trust SSH works | Access VM via browser or `cloudflared` | ⬜ |
| 30 | SSH direct access blocked | `ssh ubuntu@<vm-ip>` fails (connection refused/timeout) | ⬜ |

2. **Smoke test scenarios**
   - **Scenario A: Happy path**
     - User submits generation on Generation Screen
     - API returns 202 with executionId
     - Outbox relay publishes to Redis
     - Worker picks up job, processes pipeline
     - SSE delivers progress events
     - Job completes with `done` status
     - Result is readable via `GET /me/executions/:id`
   - **Scenario B: API restart mid-job**
     - Enqueue job, wait for `running`
     - `pm2 reload cultiv-api` (simulate deploy)
     - Verify job still completes (worker unaffected)
     - Verify client reconnects to SSE
   - **Scenario C: Worker restart mid-job**
     - Enqueue job, wait for `running`
     - `pm2 restart cultiv-worker`
     - Verify job is retried or completed (BullMQ handles retry)
     - Verify no duplicate credit capture
   - **Scenario D: Full VM restart**
     - Enqueue job
     - Reboot VM: `sudo reboot`
     - Wait for services to auto-start (PM2, Docker, cloudflared)
     - Verify health check passes
     - Verify job completes or is in queue

3. **Load test (light)**
   - 10 concurrent generation requests
   - Verify all return 202
   - Verify workers process all jobs within 10 minutes
   - Verify no outbox accumulation
   - Verify no memory leaks (check `pm2 monit` before/after)
   - Verify no PostgreSQL connection exhaustion

4. **Security audit (light)**
   - Verify **zero ports exposed**: `nmap <vm-ip>` from external host (should show no open ports)
   - Verify Cloudflare Zero Trust SSH works and direct SSH fails
   - Verify Cloudflare WAF blocks suspicious requests
   - Verify `CF-Connecting-IP` is used for rate limiting (not `X-Forwarded-For` from untrusted sources)
   - Verify `.env` is not readable by other users: `ls -la /home/ubuntu/cultiv/app/.env`
   - Verify secrets are not in logs: grep logs for API keys

5. **Rollback plan**
   - If Deploy fails or is unacceptable:
     - Railway deployment is still configured (railway.toml exists)
     - Switch DNS from Cloudflare Tunnel to Railway endpoint
     - Or keep both: use Cloudflare as proxy for Railway (if needed)
   - Document: Railway is the fallback; Integrator is the primary.

6. **Operator sign-off**
   - Document: `docs/runbooks/integrator-deploy-go-live.md`
   - Signed by: operator (you) with date
   - Notes: any known issues, workarounds, or future improvements

## Acceptance criteria

- [ ] All 30 checklist items pass.
- [ ] Smoke test scenarios A, B, C, D all pass.
- [ ] Load test (10 concurrent) passes without errors.
- [ ] Security audit passes (no exposed ports, no leaked secrets).
- [ ] Rollback plan documented and tested (if applicable).
- [ ] Operator sign-off documented.
- [ ] Go-live announced to team (if applicable) or documented.

## Implemented

✅ **Scripts created:**
- `go-live-check.sh` — Automated verification script
- `emergency-restart.sh` — Emergency restart
- `diagnose.sh` — Diagnostic report

✅ **Runbooks created:**
- `integrator-deploy-go-live.md` — Go-live checklist
- `integrator-deploy.md` — Deploy runbook
- `disaster-recovery.md` — Recovery procedures
- `monitoring-alerting.md` — Monitoring setup
- `graceful-shutdown.md` — Shutdown behavior (from Issue 64)

✅ **Issue 65 checklist:** All 30 items documented with verification methods

## Blocked by

- Issue 62 (Monitoring must be active)
- Issue 63 (Backup must be tested)
- Issue 64 (Graceful shutdown must be implemented)
- Issue 61 (Backend must be deployed)
- Issue 60 (VM must be bootstrapped)
- Issue 59 (Cloudflare must be active)
- Issue 58 (VM must be provisioned)

## Notes

- This is the final gate. Do not skip checklist items.
- The smoke test scenarios are the most important. If they pass, the deployment is functionally correct.
- The load test is light (10 concurrent). For a real load test, use a tool like `k6` or `artillery`. But for MVP, manual is sufficient.
- If any checklist item fails, create a follow-up issue and fix before go-live.
- The operator sign-off is a formality, but it forces you to review the runbook and confirm readiness.
- After go-live, the legacy Railway deployment (if any) should be decommissioned to avoid confusion.
