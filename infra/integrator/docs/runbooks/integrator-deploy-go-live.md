# Integrator Deploy — Go-Live Checklist

## Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | VPS provisioned and accessible via Cloudflare Zero Trust SSH | ⬜ |
| 2 | Cloudflare Tunnel active | ⬜ |
| 3 | DNS resolves to Cloudflare | ⬜ |
| 4 | SSL certificate valid | ⬜ |
| 5 | WAF rules active | ⬜ |
| 6 | PostgreSQL running | ⬜ |
| 7 | Redis running | ⬜ |
| 8 | API running | ⬜ |
| 9 | Worker running | ⬜ |
| 10 | Health check passes | ⬜ |
| 11 | Readiness passes | ⬜ |
| 12 | Metrics endpoint works | ⬜ |
| 13 | Auth0 JWT validates | ⬜ |
| 14 | End-to-end job enqueue | ⬜ |
| 15 | Worker completes job | ⬜ |
| 16 | Outbox relay works | ⬜ |
| 17 | Health check script active | ⬜ |
| 18 | Discord alerts work | ⬜ |
| 19 | UptimeRobot monitoring | ⬜ |
| 20 | Backup completed | ⬜ |
| 21 | Backup uploaded to Cloudflare R2 | ⬜ |
| 22 | rclone configured correctly | ⬜ |
| 23 | Deploy pipeline works | ⬜ |
| 24 | Deploy notification received | ⬜ |
| 25 | Graceful shutdown works | ⬜ |
| 26 | Frontend calls API successfully | ⬜ |
| 27 | CORS configured | ⬜ |
| 28 | Rate limiting works | ⬜ |
| 29 | Runbook documented | ⬜ |
| 30 | Cloudflare Zero Trust SSH works | ⬜ |
| 31 | SSH direct access blocked | ⬜ |
| 32 | Cloudflare R2 bucket created | ⬜ |
| 33 | R2 API token configured | ⬜ |
| 34 | rclone remote configured | ⬜ |
| 35 | Backup uploaded to R2 | ⬜ |
| 36 | verify-cloudflare.sh passes | ⬜ |

## Smoke Tests

### Scenario A: Happy Path
- [ ] User submits generation on Generation Screen
- [ ] API returns 202 with executionId
- [ ] Outbox relay publishes to Redis
- [ ] Worker picks up job, processes pipeline
- [ ] SSE delivers progress events
- [ ] Job completes with `done` status
- [ ] Result is readable via `GET /me/executions/:id`

### Scenario B: API Restart Mid-Job
- [ ] Enqueue job, wait for `running`
- [ ] `pm2 reload cultiv-api` (simulate deploy)
- [ ] Verify job still completes (worker unaffected)
- [ ] Verify client reconnects to SSE

### Scenario C: Worker Restart Mid-Job
- [ ] Enqueue job, wait for `running`
- [ ] `pm2 restart cultiv-worker`
- [ ] Verify job is retried or completed
- [ ] Verify no duplicate credit capture

### Scenario D: Full VM Restart
- [ ] Enqueue job
- [ ] Reboot VM: `sudo reboot`
- [ ] Wait for services to auto-start
- [ ] Verify health check passes
- [ ] Verify job completes or is in queue

## Load Test

- [ ] 10 concurrent generation requests
- [ ] All return 202
- [ ] Workers process all jobs within 10 minutes
- [ ] No outbox accumulation
- [ ] No memory leaks (check `pm2 monit` before/after)
- [ ] No PostgreSQL connection exhaustion

## Security Audit

- [ ] Zero ports exposed: `nmap <vm-ip>` shows no open ports
- [ ] Cloudflare Zero Trust SSH works
- [ ] Direct SSH fails: `ssh ubuntu@<vm-ip>` connection refused
- [ ] Cloudflare WAF blocks suspicious requests
- [ ] `CF-Connecting-IP` used for rate limiting
- [ ] `.env` not readable by other users
- [ ] Secrets not in logs

## Operator Sign-Off

- **Operator:** ___________________
- **Date:** ___________________
- **Environment:** Integrator VPS + Cloudflare
- **Domain:** `api.cultiv.app`
- **Notes:**

  ```
  
  ```

- **Issues found:**
  - [ ] None — ready for go-live
  - [ ] Minor issues documented (see above)
  - [ ] Major issues — go-live blocked

- **Signature:** ___________________
